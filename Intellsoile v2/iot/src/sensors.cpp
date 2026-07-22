#include "sensors.h"

// =========================
// DS18B20 setup
// =========================
OneWire oneWire(DS18B20_PIN);
DallasTemperature tempSensors(&oneWire);

DeviceAddress tempAddresses[3];

// طباعة عنوان كل حساس (اختياري)
static void printAddress(const DeviceAddress deviceAddress) {
    for (uint8_t i = 0; i < 8; i++) {
        if (deviceAddress[i] < 16) Serial.print("0");
        Serial.print(deviceAddress[i], HEX);
    }
}

// =========================
// Init
// =========================
void initSensors() {
    tempSensors.begin();

    // إعداد المضخة
    pinMode(PUMP_PIN, OUTPUT);
    digitalWrite(PUMP_PIN, LOW);

    // اكتشاف حساسات الحرارة
    int deviceCount = tempSensors.getDeviceCount();
    Serial.print("DS18B20 sensors found: ");
    Serial.println(deviceCount);

    for (int i = 0; i < 3; i++) {
        if (tempSensors.getAddress(tempAddresses[i], i)) {
            Serial.print("Temp Sensor ");
            Serial.print(i + 1);
            Serial.print(" Address: ");
            printAddress(tempAddresses[i]);
            Serial.println();
        } else {
            Serial.print("Temp Sensor ");
            Serial.print(i + 1);
            Serial.println(" not found.");
        }
    }
}

// =========================
// قراءة الحساسات
// =========================
SensorData readSensors() {
    SensorData data;

    // -------------------------
    // Read 6 FSR
    // -------------------------
    data.fsr[0] = analogRead(FSR1_PIN);
    data.fsr[1] = analogRead(FSR2_PIN);
    data.fsr[2] = analogRead(FSR3_PIN);
    data.fsr[3] = analogRead(FSR4_PIN);
    data.fsr[4] = analogRead(FSR5_PIN);
    data.fsr[5] = analogRead(FSR6_PIN);

    // -------------------------
    // Read temperatures
    // -------------------------
    tempSensors.requestTemperatures();

    for (int i = 0; i < 3; i++) {
        if (tempSensors.validAddress(tempAddresses[i])) {
            data.temperatures[i] = tempSensors.getTempC(tempAddresses[i]);
        } else {
            data.temperatures[i] = DEVICE_DISCONNECTED_C;
        }
    }

    // -------------------------
    // Pump state
    // -------------------------
    data.pumpActive = digitalRead(PUMP_PIN);

    return data;
}

// =========================
// Pump control
// =========================
void setPump(bool active) {
    digitalWrite(PUMP_PIN, active ? HIGH : LOW);
}