"""
FreshStream AI - Real Data Preprocessing Pipeline
Processes empirical laboratory E-nose beef spoilage telemetry (TS1 - TS5)
from D. R. Wijaya, R. Sarno, E. Zulaika (Institut Teknologi Sepuluh Nopember).
"""

import os
import json
import urllib.request
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

BASE_URL = "https://raw.githubusercontent.com/lumentut/tsk_centroid/main/notebooks/data"
RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "processed")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

FILES = ["TS1.csv", "TS2.csv", "TS3.csv", "TS4.csv", "TS5.csv"]
FEATURE_COLS = ["Temperature", "Humidity", "MQ3", "MQ135"]
WINDOW_SIZE = 10
TVC_FRESH_BASELINE = 2.2   # log10 CFU/g (fresh beef standard)
TVC_SPOIL_THRESHOLD = 5.0  # log10 CFU/g (official spoilage threshold)


def ensure_raw_data():
    """Ensure raw dataset files TS1.csv to TS5.csv are downloaded and verified."""
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    for filename in FILES:
        dest_path = os.path.join(RAW_DATA_DIR, filename)
        if not os.path.exists(dest_path) or os.path.getsize(dest_path) == 0:
            url = f"{BASE_URL}/{filename}"
            print(f"Downloading {url} -> {dest_path}...")
            urllib.request.urlretrieve(url, dest_path)
        assert os.path.exists(dest_path), f"File {dest_path} does not exist"


def load_and_clean_series(filepath: str):
    """
    Load a single time-series CSV, validate continuous minutes,
    handle missing values, and calculate ground-truth targets.
    """
    df = pd.read_csv(filepath)
    
    # 1. Verify required columns
    required_cols = ["minute", "TVC", "class"] + FEATURE_COLS
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column '{col}' in {filepath}")
            
    # 2. Check and handle missing/NaN values
    if df[FEATURE_COLS + ["TVC"]].isnull().any().any():
        df[FEATURE_COLS + ["TVC"]] = df[FEATURE_COLS + ["TVC"]].interpolate(method="linear").bfill().ffill()

    # 3. Validate minute sequence
    df = df.sort_values("minute").reset_index(drop=True)
    
    # 4. Determine empirical spoilage time T_spoil (first minute where TVC >= 5.0 or class == 'spoiled')
    spoil_mask = (df["TVC"] >= TVC_SPOIL_THRESHOLD) | (df["class"] == "spoiled")
    spoil_indices = df[spoil_mask].index
    if len(spoil_indices) > 0:
        spoil_minute = df.loc[spoil_indices[0], "minute"]
    else:
        spoil_minute = df["minute"].max()
        
    # 5. Derive Ground-Truth Targets:
    # RUL in hours: remaining time until spoilage threshold (clamped to 0.0)
    rul_minutes = np.maximum(0.0, spoil_minute - df["minute"].values)
    rul_hours = rul_minutes / 60.0
    
    # Health Index (0 - 100%): derived from microbiological TVC progression
    # 100% at fresh baseline (2.2 log CFU/g), 0% at spoilage threshold (5.0 log CFU/g)
    health_index = np.clip(
        100.0 * (1.0 - (df["TVC"].values - TVC_FRESH_BASELINE) / (TVC_SPOIL_THRESHOLD - TVC_FRESH_BASELINE)),
        0.0,
        100.0
    )
    
    df["rul_hours"] = rul_hours
    df["health_index"] = health_index
    df["spoil_minute"] = spoil_minute
    
    return df


def create_sliding_windows(features: np.ndarray, targets: np.ndarray, window_size: int = WINDOW_SIZE):
    """
    Generate sliding window telemetry sequences of length `window_size`.
    Features: (N, num_features) -> X: (N - window_size + 1, window_size, num_features)
    Targets:  (N, 2)            -> y: (N - window_size + 1, 2)
    """
    num_samples = len(features) - window_size + 1
    if num_samples <= 0:
        raise ValueError(f"Series length {len(features)} is smaller than window size {window_size}")
        
    X = np.empty((num_samples, window_size, features.shape[1]), dtype=np.float32)
    y = np.empty((num_samples, targets.shape[1]), dtype=np.float32)
    
    for i in range(num_samples):
        X[i] = features[i : i + window_size]
        y[i] = targets[i + window_size - 1]
        
    return X, y


def preprocess_all():
    print("=" * 60)
    print("FreshStream AI: Real E-Nose Cold-Chain Preprocessing")
    print("=" * 60)
    
    ensure_raw_data()
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Load all series
    series_dict = {}
    for filename in FILES:
        path = os.path.join(RAW_DATA_DIR, filename)
        df = load_and_clean_series(path)
        name = os.path.splitext(filename)[0]
        series_dict[name] = df
        spoil_m = df["spoil_minute"].iloc[0]
        print(f"Loaded {name}: {len(df)} rows | Spoilage at minute {spoil_m} ({spoil_m/60:.2f}h) | Initial TVC={df['TVC'].iloc[0]:.2f}")

    # Hold-out split strategy:
    # Training: TS1, TS2, TS3, TS5 (8,640 records across 4 experimental batches)
    # Testing:  TS4 (2,160 records, held-out physical batch)
    train_keys = ["TS1", "TS2", "TS3", "TS5"]
    test_keys = ["TS4"]
    
    train_dfs = [series_dict[k] for k in train_keys]
    test_dfs = [series_dict[k] for k in test_keys]
    
    # Fit StandardScaler on training features
    train_features_raw = np.concatenate([df[FEATURE_COLS].values for df in train_dfs], axis=0)
    scaler = StandardScaler()
    scaler.fit(train_features_raw)
    
    # Save scaler parameters to models/scaler_params.json and scaler.json
    scaler_params = {
        "features": FEATURE_COLS,
        "mean": scaler.mean_.tolist(),
        "std": scaler.scale_.tolist(),
        "var": scaler.var_.tolist(),
        "window_size": WINDOW_SIZE,
        "target_names": ["rul_hours", "health_index"]
    }
    
    scaler_path_1 = os.path.join(MODELS_DIR, "scaler_params.json")
    scaler_path_2 = os.path.join(MODELS_DIR, "scaler.json")
    for sp in [scaler_path_1, scaler_path_2]:
        with open(sp, "w", encoding="utf-8") as f:
            json.dump(scaler_params, f, indent=2)
    print(f"\nSaved normalization parameters to:\n  - {scaler_path_1}\n  - {scaler_path_2}")
    print(f"Scaler means: {scaler.mean_}")
    print(f"Scaler stds:  {scaler.scale_}")

    # Create sliding windows per series
    X_train_list, y_train_list = [], []
    for df in train_dfs:
        feat_scaled = scaler.transform(df[FEATURE_COLS].values)
        targs = df[["rul_hours", "health_index"]].values
        X_sub, y_sub = create_sliding_windows(feat_scaled, targs, window_size=WINDOW_SIZE)
        X_train_list.append(X_sub)
        y_train_list.append(y_sub)
        
    X_train = np.concatenate(X_train_list, axis=0)
    y_train = np.concatenate(y_train_list, axis=0)
    
    X_test_list, y_test_list = [], []
    for df in test_dfs:
        feat_scaled = scaler.transform(df[FEATURE_COLS].values)
        targs = df[["rul_hours", "health_index"]].values
        X_sub, y_sub = create_sliding_windows(feat_scaled, targs, window_size=WINDOW_SIZE)
        X_test_list.append(X_sub)
        y_test_list.append(y_sub)
        
    X_test = np.concatenate(X_test_list, axis=0)
    y_test = np.concatenate(y_test_list, axis=0)
    
    # Save processed numpy arrays
    train_out = os.path.join(PROCESSED_DATA_DIR, "train.npz")
    test_out = os.path.join(PROCESSED_DATA_DIR, "test.npz")
    
    np.savez_compressed(train_out, X=X_train, y=y_train)
    np.savez_compressed(test_out, X=X_test, y=y_test)
    
    print("\nDataset preparation summary:")
    print(f"  Training set: X_train={X_train.shape}, y_train={y_train.shape} saved to {train_out}")
    print(f"  Test set:     X_test={X_test.shape}, y_test={y_test.shape} saved to {test_out}")
    print(f"  RUL range (train): [{y_train[:, 0].min():.2f}h, {y_train[:, 0].max():.2f}h]")
    print(f"  Health Index range (train): [{y_train[:, 1].min():.1f}%, {y_train[:, 1].max():.1f}%]")
    print(f"  RUL range (test):  [{y_test[:, 0].min():.2f}h, {y_test[:, 0].max():.2f}h]")
    print(f"  Health Index range (test):  [{y_test[:, 1].min():.1f}%, {y_test[:, 1].max():.1f}%]")
    print("Preprocessing completed successfully!")

if __name__ == "__main__":
    preprocess_all()
