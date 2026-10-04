"""
FreshStream AI - FreshStreamRULNet Architecture
Hybrid 1D-CNN + LSTM Deep Neural Network for Cold-Chain Telemetry
Predicts Remaining Useful Life (hours) and Biological Health Index (0-100%).
"""

import torch
import torch.nn as nn


class FreshStreamRULNet(nn.Module):
    """
    Hybrid 1D-CNN + LSTM Network for Cold-Chain Telemetry RUL & Health Index Prediction.
    
    Inputs:
      - x: Tensor of shape [Batch, SeqLen, NumFeatures]
           Features: [Temperature, Humidity, MQ3 (Ethanol), MQ135 (Air/Gas)]
           
    Outputs:
      - rul: Tensor of shape [Batch, 1] (Continuous hours >= 0)
      - health_index: Tensor of shape [Batch, 1] (Biological health index 0.0 - 100.0%)
    """
    def __init__(
        self,
        num_features: int = 4,
        seq_len: int = 10,
        conv_channels: tuple = (32, 64),
        lstm_hidden: int = 64,
        lstm_layers: int = 2,
        dropout: float = 0.2
    ):
        super().__init__()
        self.num_features = num_features
        self.seq_len = seq_len

        # 1. 1D Convolutional Blocks for local spike / transient extraction
        # Input to Conv1d expects [Batch, InChannels, SeqLen]
        self.conv1 = nn.Conv1d(num_features, conv_channels[0], kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm1d(conv_channels[0])
        self.act1 = nn.GELU()
        self.drop1 = nn.Dropout(dropout)

        self.conv2 = nn.Conv1d(conv_channels[0], conv_channels[1], kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm1d(conv_channels[1])
        self.act2 = nn.GELU()
        self.drop2 = nn.Dropout(dropout)

        # 2. Recurrent LSTM Backbone for cumulative kinetic degradation
        self.lstm = nn.LSTM(
            input_size=conv_channels[1],
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            batch_first=True,
            dropout=dropout if lstm_layers > 1 else 0.0
        )

        # 3. Dense Shared Latent Space
        self.shared_fc = nn.Sequential(
            nn.Linear(lstm_hidden, 32),
            nn.LayerNorm(32),
            nn.GELU(),
            nn.Dropout(dropout / 2)
        )

        # 4. Multi-Task Dual Output Heads
        # RUL Head: strictly non-negative hours
        self.rul_head = nn.Sequential(
            nn.Linear(32, 1),
            nn.ReLU()
        )
        
        # Health Index Head: bounded to [0.0, 100.0]%
        self.health_head = nn.Sequential(
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor):
        # x: [Batch, SeqLen, NumFeatures]
        # Transpose to [Batch, NumFeatures, SeqLen] for Conv1d
        x = x.transpose(1, 2)
        x = self.drop1(self.act1(self.bn1(self.conv1(x))))
        x = self.drop2(self.act2(self.bn2(self.conv2(x))))

        # Transpose back to [Batch, SeqLen, ConvChannels] for LSTM
        x = x.transpose(1, 2)
        lstm_out, _ = self.lstm(x)

        # Extract representation from the final sequence step
        last_step = lstm_out[:, -1, :]
        shared_feat = self.shared_fc(last_step)

        rul = self.rul_head(shared_feat)
        health_index = self.health_head(shared_feat) * 100.0

        return rul, health_index
