#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "wifi_manager.h"

unsigned long lastReportMillis = 0;
unsigned long lastCommandMillis = 0;

void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(1000);

    Serial.println(" --- IntelliSole IoT System Starting ---");

    initSensors();
    connectWiFi();

    Serial.println("System Initialized.");
}

void loop() {
    if (millis() - lastCommandMillis >= COMMAND_INTERVAL) {
        lastCommandMillis = millis();

        bool remotePumpState = false;
        if (fetchPumpCommand(remotePumpState)) {
            setPump(remotePumpState);
            Serial.print("Remote Pump Command: ");
            Serial.println(remotePumpState ? "ON" : "OFF");
        } else {
            Serial.println("No remote command update.");
        }
    }

    if (millis() - lastReportMillis >= REPORT_INTERVAL) {
        lastReportMillis = millis();

        Serial.println("Reading sensors...");
        SensorData currentReadings = readSensors();

        Serial.println("Temperatures:");
        Serial.print("T1: "); Serial.println(currentReadings.temperatures[0]);
        Serial.print("T2: "); Serial.println(currentReadings.temperatures[1]);
        Serial.print("T3: "); Serial.println(currentReadings.temperatures[2]);

        Serial.println("FSR Readings:");
        Serial.print("FSR1: "); Serial.println(currentReadings.fsr[0]);
        Serial.print("FSR2: "); Serial.println(currentReadings.fsr[1]);
        Serial.print("FSR3: "); Serial.println(currentReadings.fsr[2]);
        Serial.print("FSR4: "); Serial.println(currentReadings.fsr[3]);
        Serial.print("FSR5: "); Serial.println(currentReadings.fsr[4]);
        Serial.print("FSR6: "); Serial.println(currentReadings.fsr[5]);

        currentReadings.pumpActive = digitalRead(PUMP_PIN);

        if (isConnected()) {
            sendDataToSupabase(currentReadings);
        } else {
            Serial.println("WiFi not connected. Reconnecting...");
            connectWiFi();
        }

        Serial.println("------------------------------");
    }

    delay(10);
}