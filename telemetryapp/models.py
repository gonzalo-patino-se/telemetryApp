from django.db import models

class Telemetry(models.Model):
    # Inverter Grid Measurements
    inverter_grid_L1_V_RMS = models.FloatField(help_text="Voltage RMS for L1 (V)")
    inverter_grid_L2_V_RMS = models.FloatField(help_text="Voltage RMS for L2 (V)")
    inverter_grid_L1_I_RMS = models.FloatField(help_text="Current RMS for L1 (A)")

    # Relay and Container Status
    BGCS_RELAY_STATUS = models.CharField(max_length=50, help_text="Relay status (e.g., ON/OFF)")
    ETP_CONTAINER_STATUS = models.CharField(max_length=50, help_text="Container status")

    # Wi-Fi Info
    WIFI_SIGNAL_STRENGTH = models.IntegerField(help_text="Signal strength in dBm")
    WIFI_FREQ_BAND = models.CharField(max_length=20, help_text="Wi-Fi frequency band (e.g., 2.4GHz, 5GHz)")

    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Telemetry @ {self.created_at}"