#ifndef NETWORK_H
#define NETWORK_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"

void connectWiFi();
bool isConnected();
void sendDataToSupabase(SensorData data);

#endif // NETWORK_H
