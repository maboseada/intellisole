#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include <DallasTemperature.h>
#include <OneWire.h>
#include "config.h"

struct SensorData {
    int fsr[6];
    float temperatures[3];
    bool pumpActive;
};

void initSensors();
SensorData readSensors();
void setPump(bool active);

#endif // SENSORS_H