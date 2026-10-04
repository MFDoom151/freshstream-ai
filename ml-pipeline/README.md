# FreshStream AI — Real Cold-Chain Telemetry ML Pipeline

## Overview
This directory contains the machine learning data pipeline and hybrid neural network architecture for **FreshStream AI**, an AgriTech & Cold-Chain Logistics SaaS system. The system predicts Remaining Useful Life (RUL) in hours and a Biological Health Index (0–100%) for perishable beef shipments based on continuous multivariate IoT sensor telemetry.

---

## 1. Dataset Provenance & Integrity Statement
**STRICT INTEGRITY ENFORCEMENT**: All training and evaluation datasets originate from genuine physical laboratory measurements. **No synthetic data is used.**

### Primary Dataset Citation
- **Authors**: Dedy Rahman Wijaya, Riyanarto Sarno, and Enny Zulaika
- **Affiliation**: Institut Teknologi Sepuluh Nopember (ITS), Surabaya, Indonesia
- **Publication**: *"Electronic nose dataset for beef quality monitoring under an uncontrolled environment"*, *BMC Research Notes* / *Data in Brief* (2022).
- **Mendeley Data DOI**: [10.17632/mwmhh766fc](https://doi.org/10.17632/mwmhh766fc)
- **BMC Article DOI**: [10.1186/s13104-022-06126-9](https://doi.org/10.1186/s13104-022-06126-9)
- **Open-Source Repository**: [lumentut/tsk_centroid](https://github.com/lumentut/tsk_centroid)
- **License**: 
  - Code: **MIT License**
  - Dataset: **Creative Commons Attribution 4.0 International (CC BY 4.0)**

### Physical Experiment Details
The experimental setup comprised 500g fresh beef cuts placed in a sample chamber subjected to continuous monitoring over 36 hours (2,160 continuous minutes per run) across 5 separate time-series experiments (`TS1.csv` through `TS5.csv`). Sensor telemetry was recorded every minute using an array of Metal-Oxide Semiconductor (MOS) sensors alongside digital temperature and relative humidity sensors. In parallel, empirical microbial load was assayed via standard laboratory Total Viable Count (TVC, measured in $\log_{10} \text{CFU/g}$).

---

## 2. Feature Mapping & Telemetry Dimensions

The model accepts 4 primary IoT sensor dimensions:

| Telemetry Channel | Dataset Column | Physical Dimension | Description in Cold-Chain IoT |
|---|---|---|---|
| **Channel 0** | `Temperature` | °C ($29.1^\circ\text{C} - 39.8^\circ\text{C}$) | Thermal chamber temperature; primary driver of kinetic acceleration. |
| **Channel 1** | `Humidity` | % RH ($40.9\% - 99.9\%$) | Relative ambient humidity in container. |
| **Channel 2** | `MQ3` | Sensor Resistance ($k\Omega$) | Chemoresistive tin-oxide ($SnO_2$) sensor sensitive to **Alcohol & Ethanol ($C_2H_5OH$)** — earliest chemical biomarker of fermentation. |
| **Channel 3** | `MQ135` | Sensor Resistance ($k\Omega$) | Chemoresistive sensor sensitive to **Ammonia ($NH_3$), $CO_2$, and volatile putrefactive amines**. |

---

## 3. Ground-Truth Target Derivation

### 3.1 Remaining Useful Life (RUL, Hours)
According to international food safety regulations and standard meat microbiology:
- Beef is fresh when Total Viable Count is $\approx 2.2 \dots 3.0 \log_{10} \text{CFU/g}$.
- Beef is deemed **spoiled** and unfit for human consumption once microbial load reaches or exceeds $\text{TVC} \ge 5.0 \log_{10} \text{CFU/g}$.

Let $T_{\text{spoil}}$ be the timestamp index (in minutes) where $\text{TVC} \ge 5.0$. For any current timestamp $t$:
$$\text{RUL}_{\text{minutes}}(t) = \max(0, T_{\text{spoil}} - t)$$
$$\text{RUL}_{\text{hours}}(t) = \frac{\text{RUL}_{\text{minutes}}(t)}{60.0}$$

Empirical spoilage transitions observed in the dataset:
- `TS1`: Minute 1,201 (20.02 hours)
- `TS2`: Minute 1,501 (25.02 hours)
- `TS3`: Minute 1,261 (21.02 hours)
- `TS4`: Minute 1,321 (22.02 hours)
- `TS5`: Minute 1,321 (22.02 hours)

### 3.2 Biological Health Index (0–100%)
Derived directly from the continuous microbiological microbial load:
$$\text{Health Index}(t) = \text{clip}\left(100.0 \times \left(1.0 - \frac{\text{TVC}(t) - 2.2}{5.0 - 2.2}\right), 0.0, 100.0\right)$$
- Fresh baseline ($\text{TVC} = 2.2$): $100.0\%$
- Mid-decay ($\text{TVC} \approx 3.6$): $50.0\%$
- Spoilage threshold ($\text{TVC} \ge 5.0$): $0.0\%$

---

## 4. Train / Test Split Strategy

To prevent temporal leakage across sequential readings, the train/test split partitions distinct experimental runs:
- **Training Set (80%)**: `TS1`, `TS2`, `TS3`, `TS5` (8,604 sliding-window sequences)
- **Held-Out Test Set (20%)**: `TS4` (2,151 sliding-window sequences)

Sliding window length: $L = 10$ timesteps (last 10 minutes of multivariate sensor history), yielding input tensors of shape `[Batch, 10, 4]`.

---

## 5. Model Architecture: `FreshStreamRULNet`

A hybrid **1D-CNN + LSTM** multi-task neural network:
1. **1D-CNN Feature Extractor**: Two sequential `Conv1d` blocks (`32` and `64` channels, `kernel_size=3, padding=1`, `BatchNorm1d`, `GELU`, `Dropout=0.2`) to capture high-frequency thermal/gas fluctuations and sudden micro-breaches.
2. **LSTM Recurrent Backbone**: 2-layer stacked LSTM (`hidden_size=64`, `dropout=0.2`) to model cumulative temporal degradation dynamics.
3. **Multi-Task Heads**:
   - `rul_head`: Linear projection + `ReLU` activation guaranteeing $\hat{y}_{\text{rul}} \ge 0.0$ hours.
   - `health_head`: Linear projection + `Sigmoid` activation $\times 100.0$ guaranteeing $\hat{y}_{\text{health}} \in [0.0, 100.0]\%$.

---

## 6. Execution & Verification

Run the full preprocessing and training pipeline:
```bash
# 1. Preprocess raw data and generate sliding windows
python ml-pipeline/preprocess.py

# 2. Train model and export ONNX
python ml-pipeline/train.py
```

### Artifacts Generated
- `ml-pipeline/data/raw/TS{1..5}.csv`: Raw empirical time-series.
- `ml-pipeline/data/processed/train.npz`, `test.npz`: Windowed and scaled arrays.
- `ml-pipeline/models/scaler_params.json`: Normalization mean and standard deviation.
- `ml-pipeline/models/freshstream_real_rul.onnx`: Exported ONNX model (opset 17, dynamic batch).
- `public/models/freshstream_real_rul.onnx`: Production ONNX deployment copy for Next.js API.
