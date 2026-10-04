"""
Download real E-nose beef spoilage dataset (TS1.csv to TS5.csv)
from GitHub repository lumentut/tsk_centroid.
Origin: D. R. Wijaya, R. Sarno, E. Zulaika - BMC Research Notes / Mendeley Data.
"""

import os
import urllib.request
import pandas as pd

BASE_URL = "https://raw.githubusercontent.com/lumentut/tsk_centroid/main/notebooks/data"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")
FILES = ["TS1.csv", "TS2.csv", "TS3.csv", "TS4.csv", "TS5.csv"]

def download_dataset():
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"Downloading real dataset files to: {DATA_DIR}")
    
    for filename in FILES:
        url = f"{BASE_URL}/{filename}"
        dest_path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(dest_path) or os.path.getsize(dest_path) == 0:
            print(f"Fetching {url} -> {dest_path}...")
            urllib.request.urlretrieve(url, dest_path)
            file_size = os.path.getsize(dest_path)
            print(f"Downloaded {filename} ({file_size} bytes)")
        else:
            print(f"File {filename} already exists ({os.path.getsize(dest_path)} bytes)")
            
        # Verify CSV validity and columns
        df = pd.read_csv(dest_path)
        print(f"Verified {filename}: shape={df.shape}, cols={list(df.columns[:8])}...")
        assert "TVC" in df.columns, f"Missing TVC column in {filename}"
        assert "Temperature" in df.columns, f"Missing Temperature in {filename}"
        assert "Humidity" in df.columns, f"Missing Humidity in {filename}"
        assert "MQ3" in df.columns, f"Missing MQ3 in {filename}"
        assert "MQ135" in df.columns, f"Missing MQ135 in {filename}"

    print("All 5 real beef spoilage time-series datasets downloaded and verified successfully!")

if __name__ == "__main__":
    download_dataset()
