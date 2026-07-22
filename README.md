[README.md](https://github.com/user-attachments/files/30251502/README.md)
# 🦶 IntelliSole

[![Platform](https://img.shields.io/badge/Platform-ESP32-blue.svg)]()
[![Language](https://img.shields.io/badge/Language-Embedded%20C%2B%2B-green.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Supabase%20%7C%20PostgreSQL-orange.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014%20%7C%20TypeScript-black.svg)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen.svg)]()

> An end-to-end smart insole system for continuous real-time diabetic foot monitoring — integrating an ESP32 sensor node, a Supabase cloud backend with automated clinical alerting, and a Next.js web platform for patient and doctor management.

**Solo Project · 2025–Present**

---

## 📌 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Hardware](#-hardware)
- [Firmware](#-firmware)
- [Cloud Backend](#-cloud-backend)
- [AI / ML Status](#-ai--ml-status)
- [Getting Started](#-getting-started)

---

## 🔍 Overview

IntelliSole addresses one of the most serious complications of diabetes — **plantar ulcer formation** — by providing continuous, spatially-resolved monitoring of foot pressure and temperature that patients with peripheral neuropathy cannot feel themselves.

The system spans three integrated layers:
1. **ESP32 Edge Node** — 6 FSR pressure sensors + 3 DS18B20 temperature sensors + remotely-commanded water pump
2. **Supabase Cloud Backend** — 11-table PostgreSQL schema with automated clinical alert triggers and Row Level Security
3. **Next.js Web Application** — Real-time patient dashboard, doctor management panel, and full appointment booking system

---

## 🏗️ System Architecture

```
[PATIENT FOOT]
 FSR1–FSR6 (6-zone pressure) + DS18B20 ×3 (3-zone temperature) + Water Pump
         |
         | 12-bit ADC reads + OneWire protocol
         v
[ESP32 EDGE NODE]  ← Device ID: esp32_node_01
 sensors.cpp | network.cpp | main.cpp
 REPORT every 5s → POST /sensor_data
 COMMAND poll every 2s → GET /device_commands
         |
         | WiFi → HTTPS REST API
         v
[SUPABASE CLOUD BACKEND]
 11 tables · 3 triggers · Full RLS
 Realtime: sensor_data, alerts, device_commands
         |
         | WebSocket subscriptions
         v
[NEXT.JS WEB APPLICATION]
 Patient Dashboard · Doctor Panel · Appointments · Alerts
```

---

## 🔌 Hardware

### ESP32 Pinout

| GPIO | Component | Function |
|:---|:---|:---|
| `34, 35, 32, 33, 36, 39` | FSR ×6 | Plantar pressure — 6 anatomical zones |
| `4` (OneWire) | DS18B20 ×3 | Foot temperature — 3 zones (±0.5°C) |
| `25` | Water Pump | Remote therapeutic pressure relief |

### Component Selection Rationale

- **FSR over capacitive sensors** — thin, flexible form factor suited to insole integration without additional signal conditioning
- **DS18B20 over thermistors** — OneWire addressing: multiple sensors share one GPIO pin, minimizing wiring complexity
- **ESP32 over Arduino + WiFi shield** — integrated WiFi + 12-bit ADC + dual-core in a single module

---

## 💻 Firmware

### Dual-Interval Non-Blocking Loop

```cpp
// Every 5 seconds: acquire + upload
if (millis() - lastReportMillis >= REPORT_INTERVAL) {
    SensorData data = readSensors();  // 6x ADC + 3x DS18B20
    if (isConnected()) sendDataToSupabase(data);
}

// Every 2 seconds: poll remote commands
if (millis() - lastCommandMillis >= COMMAND_INTERVAL) {
    bool pumpState = false;
    if (fetchPumpCommand(pumpState)) setPump(pumpState);
}
```

Two separate intervals because sensor upload and command responsiveness have different latency requirements. No blocking `delay()` calls in the critical path.

### JSON Payload (every 5s)
```json
{
  "device_id": "esp32_node_01",
  "temperature": 33.5,
  "battery": 100,
  "pump_percentage": 0,
  "pressure_readings": { "fsr1": 2048, "fsr2": 1024, "fsr3": 3050, "fsr4": 512, "fsr5": 2900, "fsr6": 1800 }
}
```

### Firmware Versions

| | V1 | V2 |
|:---|:---|:---|
| **Structure** | Monolithic `.ino` + separate modules | PlatformIO `src/` — `main.cpp`, `sensors.cpp`, `network.cpp` |
| **Build** | Arduino IDE | PlatformIO CLI |

---

## ☁️ Cloud Backend

### Key Database Tables

| Table | Purpose |
|:---|:---|
| `sensor_data` | Raw IoT stream — pressure + temperature, linked to patient |
| `device_commands` | Bidirectional pump control (`pump_on: boolean`) |
| `devices` | Maps `device_id` → `patient_id` |
| `alerts` | Auto-generated clinical alerts |
| `appointments` | Doctor-patient booking with DB-level conflict prevention |
| `users` | Patients and doctors with per-patient `alert_thresholds` |

### 3 Automated Triggers

1. **`link_device_to_patient`** (BEFORE INSERT) — Auto-resolves `device_id` → `patient_id`. Firmware never needs to know patient UUID.
2. **`process_sensor_data_alerts`** (AFTER INSERT) — Auto-generates `low_battery`, `pump_error`, `high_temperature`, `low_temperature` alerts against per-patient thresholds. Fires even when the frontend is offline.
3. **`create_default_schedule_for_doctor`** (AFTER INSERT on users) — Auto-creates schedule settings for new doctor accounts.

---

## 🤖 AI / ML Status

The current system implements the **sensing infrastructure and data pipeline** for AI-driven analysis.

**Implemented:** 6-zone pressure acquisition · 3-zone temperature monitoring · Continuous cloud time-series storage · Threshold-based automated alerting

**Under Active Development:** Plantar pressure pattern classification · Temperature trend analysis · Personalized threshold optimization · Predictive ulcer risk scoring

---

## 🚀 Getting Started

### Flash the Firmware

```bash
# V2 — PlatformIO
cd iot/
pio run --target upload
```

### Configure `config.h`
```cpp
#define WIFI_SSID     "your-wifi"
#define WIFI_PASS     "your-password"
#define SUPABASE_URL  "https://your-project.supabase.co"
#define SUPABASE_KEY  "your-publishable-key"
#define DEVICE_ID     "esp32_node_01"
```

### Apply Database Schema
```bash
# Run in Supabase SQL Editor
schema.sql               # Main tables, triggers, RLS
appointments_schema.sql  # Appointment booking system
```

---

## 📜 License

MIT License
