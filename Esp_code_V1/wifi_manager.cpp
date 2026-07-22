#include "wifi_manager.h"

void connectWiFi() {
    Serial.println("Connecting to WiFi...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected.");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nWiFi connection failed.");
    }
}

bool isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

// ==========================

void sendDataToSupabase(const SensorData& data) {
    if (!isConnected()) {
        connectWiFi();
    }

    if (!isConnected()) {
        Serial.println("Still not connected. Upload skipped.");
        return;
    }

    HTTPClient http;
    String url = String(SUPABASE_URL) + "/rest/v1/" + String(SUPABASE_TABLE);

    http.begin(url);
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "return=minimal");

    DynamicJsonDocument jsonDoc(768);

    jsonDoc["device_id"] = DEVICE_ID;

    // ✅ حساب متوسط الحرارة
    float avgTemp = 0.0;
    int validTemps = 0;

    for (int i = 0; i < 3; i++) {
        if (data.temperatures[i] != DEVICE_DISCONNECTED_C) {
            avgTemp += data.temperatures[i];
            validTemps++;
        }
    }

    if (validTemps > 0) {
        avgTemp /= validTemps;
        jsonDoc["temperature"] = avgTemp;
    } else {
        jsonDoc["temperature"] = nullptr; // 🔥 مهم لتجنب 400
    }

    // ✅ أسماء الأعمدة الصح
    jsonDoc["battery_percentage"] = 100;
    jsonDoc["pump_percentage"] = data.pumpActive ? 100 : 0;

    // ✅ FSR 6 sensors
    JsonObject pressure = jsonDoc.createNestedObject("pressure_readings");
    pressure["fsr1"] = data.fsr[0];
    pressure["fsr2"] = data.fsr[1];
    pressure["fsr3"] = data.fsr[2];
    pressure["fsr4"] = data.fsr[3];
    pressure["fsr5"] = data.fsr[4];
    pressure["fsr6"] = data.fsr[5];

    String jsonPayload;
    serializeJson(jsonDoc, jsonPayload);

    Serial.println("Sending JSON:");
    Serial.println(jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    Serial.print("Upload code: ");
    Serial.println(httpResponseCode);

    String response = http.getString();
    Serial.println("Server response:");
    Serial.println(response);

    http.end();
}

// ==========================

bool fetchPumpCommand(bool &pumpOn) {
    if (!isConnected()) {
        connectWiFi();
    }

    if (!isConnected()) {
        return false;
    }

    HTTPClient http;

    String url = String(SUPABASE_URL)
      + "/rest/v1/" + String(COMMANDS_TABLE)
      + "?device_id=eq." + String(DEVICE_ID)
      + "&select=pump_on"
      + "&order=updated_at.desc"
      + "&limit=1";

    http.begin(url);
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
    http.addHeader("Accept", "application/json");

    int httpCode = http.GET();

    Serial.print("Command fetch code: ");
    Serial.println(httpCode);

    if (httpCode <= 0) {
        http.end();
        return false;
    }

    String response = http.getString();
    http.end();

    Serial.println("Command response:");
    Serial.println(response);

    DynamicJsonDocument doc(256);
    DeserializationError err = deserializeJson(doc, response);

    if (err) {
        Serial.println("JSON parse error");
        return false;
    }

    if (!doc.is<JsonArray>() || doc.size() == 0) {
        Serial.println("No command row found");
        pumpOn = false;
        return true;
    }

    pumpOn = doc[0]["pump_on"] | false;
    return true;
}