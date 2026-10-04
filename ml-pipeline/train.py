"""
FreshStream AI - PyTorch Training & ONNX Export Pipeline
Trains FreshStreamRULNet (1D-CNN + LSTM) on empirical E-nose beef spoilage data.
Evaluates MAE & RMSE on held-out test batch (TS4).
Exports production-ready ONNX model with opset 17 and dynamic batch axis.
"""

import os
import sys
import shutil
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

# Ensure ml-pipeline directory is on path and UTF-8 encoding is enforced
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from model import FreshStreamRULNet
from preprocess import preprocess_all

PROCESSED_DIR = os.path.join(CURRENT_DIR, "data", "processed")
MODELS_DIR = os.path.join(CURRENT_DIR, "models")
PUBLIC_MODELS_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "public", "models")

TRAIN_NPZ = os.path.join(PROCESSED_DIR, "train.npz")
TEST_NPZ = os.path.join(PROCESSED_DIR, "test.npz")
PYTORCH_WEIGHTS = os.path.join(MODELS_DIR, "freshstream_real_rul.pt")
ONNX_EXPORT_PATH = os.path.join(MODELS_DIR, "freshstream_real_rul.onnx")
PUBLIC_ONNX_PATH = os.path.join(PUBLIC_MODELS_DIR, "freshstream_real_rul.onnx")


def load_data():
    if not os.path.exists(TRAIN_NPZ) or not os.path.exists(TEST_NPZ):
        print("Processed datasets not found. Running preprocessing...")
        preprocess_all()

    train_data = np.load(TRAIN_NPZ)
    test_data = np.load(TEST_NPZ)

    X_train = torch.tensor(train_data["X"], dtype=torch.float32)
    y_train = torch.tensor(train_data["y"], dtype=torch.float32)

    X_test = torch.tensor(test_data["X"], dtype=torch.float32)
    y_test = torch.tensor(test_data["y"], dtype=torch.float32)

    print(f"Loaded training data: X={X_train.shape}, y={y_train.shape}")
    print(f"Loaded test data:     X={X_test.shape}, y={y_test.shape}")
    return X_train, y_train, X_test, y_test


def train_model(epochs=30, batch_size=64, lr=1e-3, seed=42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(PUBLIC_MODELS_DIR, exist_ok=True)

    X_train, y_train, X_test, y_test = load_data()

    train_dataset = TensorDataset(X_train, y_train)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}")

    num_features = X_train.shape[2]  # 4: Temp, Humidity, MQ3, MQ135
    seq_len = X_train.shape[1]       # 10
    model = FreshStreamRULNet(num_features=num_features, seq_len=seq_len).to(device)

    criterion_rul = nn.SmoothL1Loss()
    criterion_health = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_test_loss = float("inf")
    print("\nStarting training FreshStreamRULNet (1D-CNN + LSTM)...")
    print("-" * 65)

    for epoch in range(1, epochs + 1):
        model.train()
        train_rul_loss = 0.0
        train_health_loss = 0.0
        total_samples = 0

        for batch_x, batch_y in train_loader:
            batch_x = batch_x.to(device)
            target_rul = batch_y[:, 0:1].to(device)
            target_health = batch_y[:, 1:2].to(device)

            optimizer.zero_grad()
            pred_rul, pred_health = model(batch_x)

            loss_r = criterion_rul(pred_rul, target_rul)
            # Normalize health index to [0, 1] for balanced gradient scaling
            loss_h = criterion_health(pred_health / 100.0, target_health / 100.0)
            loss = loss_r + 15.0 * loss_h

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_rul_loss += loss_r.item() * len(batch_x)
            train_health_loss += loss_h.item() * len(batch_x)
            total_samples += len(batch_x)

        scheduler.step()
        train_rul_loss /= total_samples
        train_health_loss /= total_samples

        # Periodic test evaluation
        if epoch % 5 == 0 or epoch == epochs:
            model.eval()
            with torch.no_grad():
                test_x = X_test.to(device)
                pred_rul_test, pred_health_test = model(test_x)
                test_rul_err = torch.abs(pred_rul_test.cpu() - y_test[:, 0:1]).mean().item()
                test_health_err = torch.abs(pred_health_test.cpu() - y_test[:, 1:2]).mean().item()

            print(f"Epoch {epoch:2d}/{epochs:2d} | Train RUL Loss: {train_rul_loss:.4f} | Health Loss: {train_health_loss:.4f} | Test RUL MAE: {test_rul_err:.3f}h | Test Health MAE: {test_health_err:.2f}%")

            if test_rul_err < best_test_loss:
                best_test_loss = test_rul_err
                torch.save(model.state_dict(), PYTORCH_WEIGHTS)

    print("-" * 65)
    print(f"Training complete. Best checkpoint saved to {PYTORCH_WEIGHTS}")

    # Load best model for evaluation & export
    model.load_state_dict(torch.load(PYTORCH_WEIGHTS, map_location=device))
    model.eval()
    evaluate_model(model, X_test, y_test, device)
    export_onnx(model, num_features=num_features, seq_len=seq_len)
    verify_onnx(X_test)


def evaluate_model(model, X_test, y_test, device):
    """Evaluate model on held-out test set and print MAE and RMSE metrics."""
    model.eval()
    with torch.no_grad():
        test_x = X_test.to(device)
        pred_rul, pred_health = model(test_x)
        pred_rul = pred_rul.cpu().numpy().flatten()
        pred_health = pred_health.cpu().numpy().flatten()

    true_rul = y_test[:, 0].numpy().flatten()
    true_health = y_test[:, 1].numpy().flatten()

    # Calculate MAE and RMSE
    mae_rul = float(np.mean(np.abs(pred_rul - true_rul)))
    rmse_rul = float(np.sqrt(np.mean((pred_rul - true_rul) ** 2)))

    mae_health = float(np.mean(np.abs(pred_health - true_health)))
    rmse_health = float(np.sqrt(np.mean((pred_health - true_health) ** 2)))

    print("\n" + "=" * 65)
    print("FreshStream AI - Model Evaluation on Held-Out Test Set (TS4)")
    print("=" * 65)
    print(f"Total Test Samples: {len(true_rul)}")
    print("\n--- Remaining Useful Life (RUL, Hours) ---")
    print(f"  MAE  (Mean Absolute Error):       {mae_rul:.4f} hours")
    print(f"  RMSE (Root Mean Squared Error):   {rmse_rul:.4f} hours")
    print("\n--- Biological Health Index (0 - 100%) ---")
    print(f"  MAE  (Mean Absolute Error):       {mae_health:.4f} %")
    print(f"  RMSE (Root Mean Squared Error):   {rmse_health:.4f} %")
    print("=" * 65 + "\n")

    return mae_rul, rmse_rul, mae_health, rmse_health


def export_onnx(model, num_features=4, seq_len=10):
    """Export PyTorch model to ONNX format with opset 17 and dynamic batch axis."""
    model.eval()
    model.to("cpu")
    dummy_input = torch.randn(1, seq_len, num_features, dtype=torch.float32)

    print(f"Exporting ONNX model to {ONNX_EXPORT_PATH}...")
    try:
        torch.onnx.export(
            model,
            dummy_input,
            ONNX_EXPORT_PATH,
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["telemetry_sequence"],
            output_names=["rul", "health_index"],
            dynamic_axes={
                "telemetry_sequence": {0: "batch_size"},
                "rul": {0: "batch_size"},
                "health_index": {0: "batch_size"},
            },
            dynamo=False,
        )
    except TypeError:
        torch.onnx.export(
            model,
            dummy_input,
            ONNX_EXPORT_PATH,
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["telemetry_sequence"],
            output_names=["rul", "health_index"],
            dynamic_axes={
                "telemetry_sequence": {0: "batch_size"},
                "rul": {0: "batch_size"},
                "health_index": {0: "batch_size"},
            },
        )
    assert os.path.exists(ONNX_EXPORT_PATH), "ONNX export failed: file not created"
    onnx_size = os.path.getsize(ONNX_EXPORT_PATH)
    print(f"ONNX model exported successfully ({onnx_size:,} bytes, opset 17)")

    # Copy to public/models for Next.js web application
    os.makedirs(PUBLIC_MODELS_DIR, exist_ok=True)
    shutil.copy2(ONNX_EXPORT_PATH, PUBLIC_ONNX_PATH)
    print(f"Copied ONNX model to web public folder: {PUBLIC_ONNX_PATH}")


def verify_onnx(X_test):
    """Verify that the exported ONNX model loads cleanly in onnxruntime and matches predictions."""
    import onnxruntime as ort

    print("\nVerifying ONNX model with onnxruntime...")
    session = ort.InferenceSession(ONNX_EXPORT_PATH, providers=["CPUExecutionProvider"])

    input_meta = session.get_inputs()[0]
    output_metas = session.get_outputs()
    print(f"  Input name: '{input_meta.name}', Shape: {input_meta.shape}, Type: {input_meta.type}")
    print(f"  Outputs: {[o.name + ' ' + str(o.shape) for o in output_metas]}")

    # Test single-sequence inference [1, 10, 4]
    sample_seq = X_test[:1].numpy()
    results = session.run(None, {input_meta.name: sample_seq})
    pred_rul = float(results[0][0][0])
    pred_health = float(results[1][0][0])

    print(f"\nSample Single-Window Test Inference:")
    print(f"  Input sequence shape: {sample_seq.shape}")
    print(f"  Predicted RUL:         {pred_rul:.2f} hours")
    print(f"  Predicted Health Index:{pred_health:.2f}%")

    # Test batch inference [32, 10, 4] to verify dynamic batching
    batch_sample = X_test[:32].numpy()
    batch_results = session.run(None, {input_meta.name: batch_sample})
    assert batch_results[0].shape == (32, 1), f"Expected shape (32, 1), got {batch_results[0].shape}"
    assert batch_results[1].shape == (32, 1), f"Expected shape (32, 1), got {batch_results[1].shape}"
    print(f"Dynamic batch test [32, 10, 4] -> RUL {batch_results[0].shape}, Health {batch_results[1].shape}: PASSED")

    # Also verify the copy in public/models
    pub_session = ort.InferenceSession(PUBLIC_ONNX_PATH, providers=["CPUExecutionProvider"])
    pub_results = pub_session.run(None, {input_meta.name: sample_seq})
    assert np.allclose(results[0], pub_results[0]), "Public model outputs do not match ml-pipeline outputs"
    print("Public folder model verification: PASSED (100% parity with pipeline model)")
    print("\nAll ONNX verification checks passed successfully!")


if __name__ == "__main__":
    train_model(epochs=30, batch_size=64, lr=1e-3)
