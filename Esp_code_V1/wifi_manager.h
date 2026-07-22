#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"

void connectWiFi();
bool isConnected();
void sendDataToSupabase(const SensorData& data);
bool fetchPumpCommand(bool &pumpOn);

#endif