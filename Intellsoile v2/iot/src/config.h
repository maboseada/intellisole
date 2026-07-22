#ifndef CONFIG_H
#define CONFIG_H

// =========================
// WiFi
// =========================
#define WIFI_SSID "Mi"
#define WIFI_PASS "123456789"

// =========================
// Supabase
// =========================
#define SUPABASE_URL "https://homdwmjhukeajheynhrd.supabase.co"
#define SUPABASE_KEY "sb_publishable_8FuNzeRACfe3KzLqqt_Y2Q_FNxPtiW4"
#define SUPABASE_TABLE "sensor_data"

// جدول الأوامر من الأبلكيشن
#define COMMANDS_TABLE "device_commands"


// معرف ثابت للجهاز
#define DEVICE_ID "esp32_node_01"

// =========================
// Pins
// =========================
#define FSR1_PIN 34
#define FSR2_PIN 35
#define FSR3_PIN 32
#define FSR4_PIN 33
#define FSR5_PIN 36
#define FSR6_PIN 39

#define DS18B20_PIN 4
#define PUMP_PIN 25

// =========================
// Settings
// =========================
#define SERIAL_BAUD 115200
#define REPORT_INTERVAL 5000
#define COMMAND_INTERVAL 2000

#endif