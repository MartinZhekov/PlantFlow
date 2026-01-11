# ESP32 Integration Guide

This guide explains how to integrate your ESP32 board with the PlantFlow API via MQTT.

## Overview

Your ESP32 will:
1. Read sensor data (temperature, humidity, soil moisture, light)
2. Connect to your WiFi network
3. Connect to the Mosquitto MQTT broker
4. Publish sensor readings as JSON messages
5. Data automatically flows to the backend and appears in your frontend

## Hardware Setup

### Required Components
- ESP32 development board
- DHT22 or DHT11 sensor (temperature & humidity)
- Soil moisture sensor
- LDR (Light Dependent Resistor) or BH1750 light sensor
- Jumper wires
- Breadboard

### Wiring Diagram

```
ESP32 Pin Connections:
- DHT22 Data Pin → GPIO 4
- Soil Moisture Analog → GPIO 34
- LDR Analog → GPIO 35
- All sensors VCC → 3.3V
- All sensors GND → GND
```

## Arduino Code

### 1. Install Required Libraries

In Arduino IDE, install these libraries via Library Manager:
- `PubSubClient` by Nick O'Leary
- `DHT sensor library` by Adafruit
- `ArduinoJson` by Benoit Blanchon
- `WiFi` (built-in for ESP32)

### 2. Complete ESP32 Code

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "192.168.1.100";  // Your computer's IP running Mosquitto
const int mqtt_port = 1883;
const char* device_id = "esp32-001";  // Unique device ID

// Sensor pins
#define DHT_PIN 4
#define SOIL_MOISTURE_PIN 34
#define LIGHT_SENSOR_PIN 35
#define DHT_TYPE DHT22

// Initialize sensors
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// Reading interval (milliseconds)
const long interval = 60000;  // 1 minute
unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  dht.begin();
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  
  // Connect to WiFi
  setup_wifi();
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Handle incoming MQTT messages (if needed)
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Create a client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void readAndPublishSensors() {
  // Read temperature and humidity
  float temperature = dht.readTemperature();
  float air_humidity = dht.readHumidity();
  
  // Read soil moisture (0-4095 for ESP32 ADC)
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  float soil_moisture = map(soilMoistureRaw, 0, 4095, 0, 100);
  
  // Read light sensor (0-4095 for ESP32 ADC)
  int lightRaw = analogRead(LIGHT_SENSOR_PIN);
  float light = map(lightRaw, 0, 4095, 0, 20000);  // Map to lux (approximate)
  
  // Check if readings are valid
  if (isnan(temperature) || isnan(air_humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  // Create JSON document
  StaticJsonDocument<200> doc;
  doc["temperature"] = round(temperature * 10) / 10.0;  // Round to 1 decimal
  doc["air_humidity"] = round(air_humidity * 10) / 10.0;
  doc["soil_moisture"] = round(soil_moisture * 10) / 10.0;
  doc["light"] = round(light);
  
  // Serialize JSON to string
  char jsonBuffer[200];
  serializeJson(doc, jsonBuffer);
  
  // Create MQTT topic
  String topic = "plantflow/devices/";
  topic += device_id;
  topic += "/sensors";
  
  // Publish to MQTT
  if (client.publish(topic.c_str(), jsonBuffer)) {
    Serial.println("Data published successfully:");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("Failed to publish data");
  }
  
  // Print to serial for debugging
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print("°C, Humidity: ");
  Serial.print(air_humidity);
  Serial.print("%, Soil: ");
  Serial.print(soil_moisture);
  Serial.print("%, Light: ");
  Serial.println(light);
}

void loop() {
  // Ensure MQTT connection
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Read and publish sensors at interval
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    readAndPublishSensors();
  }
}
```

### 3. Configuration Steps

1. **Update WiFi Credentials**:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. **Set MQTT Broker IP**:
   Find your computer's IP address:
   - macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
   - Linux: `ip addr show`
   
   Update the code:
   ```cpp
   const char* mqtt_server = "192.168.1.100";  // Your IP
   ```

3. **Set Unique Device ID**:
   ```cpp
   const char* device_id = "esp32-001";  // Change for each device
   ```

4. **Adjust Reading Interval** (optional):
   ```cpp
   const long interval = 60000;  // milliseconds (60000 = 1 minute)
   ```

## Testing

### 1. Monitor Serial Output
Open Serial Monitor (115200 baud) to see:
- WiFi connection status
- MQTT connection status
- Sensor readings
- Publish confirmations

### 2. Test MQTT Messages
Subscribe to your device's topic:
```bash
mosquitto_sub -h localhost -t "plantflow/devices/esp32-001/sensors"
```

You should see JSON messages like:
```json
{"temperature":24.5,"air_humidity":65,"soil_moisture":42,"light":12500}
```

### 3. Verify Backend Storage
Check if data is being stored:
```bash
curl http://localhost:3001/api/sensors/esp32-001/latest
```

## Troubleshooting

### WiFi Connection Issues
- Double-check SSID and password
- Ensure ESP32 is within WiFi range
- Check if your network uses 2.4GHz (ESP32 doesn't support 5GHz)

### MQTT Connection Issues
- Verify MQTT broker is running: `brew services list | grep mosquitto`
- Check firewall settings (allow port 1883)
- Ensure ESP32 and computer are on same network
- Test with: `mosquitto_pub -h YOUR_IP -t test -m "hello"`

### Sensor Reading Issues
- **DHT22 returns NaN**: Check wiring, add 10kΩ pull-up resistor
- **Soil moisture always 0 or 100**: Calibrate sensor, check analog pin
- **Light sensor inaccurate**: Calibrate mapping values for your sensor

### No Data in Backend
- Check Serial Monitor for publish confirmations
- Verify topic format matches: `plantflow/devices/{deviceId}/sensors`
- Check backend logs for MQTT messages
- Ensure device is registered (auto-registration should work)

## Advanced Features

### Battery Monitoring
Add battery voltage monitoring:
```cpp
float batteryVoltage = analogRead(BATTERY_PIN) * (3.3 / 4095.0) * 2;
doc["battery"] = batteryVoltage;
```

### Deep Sleep Mode
For battery-powered devices:
```cpp
// After publishing data
esp_sleep_enable_timer_wakeup(60 * 1000000);  // 60 seconds
esp_deep_sleep_start();
```

### OTA Updates
Enable Over-The-Air firmware updates:
```cpp
#include <ArduinoOTA.h>
// Add OTA setup in setup()
```

## Message Format Reference

### Required Fields
At least one sensor value should be present:
- `temperature` (number) - Temperature in °C
- `air_humidity` (number) - Air humidity in %
- `soil_moisture` (number) - Soil moisture in %
- `light` (number) - Light intensity in lux

### Optional Fields
- `timestamp` (ISO 8601 string) - Custom timestamp
- `battery` (number) - Battery voltage

### Example Messages

Minimal:
```json
{"temperature": 24.5}
```

Complete:
```json
{
  "temperature": 24.5,
  "air_humidity": 65,
  "soil_moisture": 42,
  "light": 12500,
  "battery": 3.7
}
```

## Next Steps

1. Upload code to ESP32
2. Monitor Serial output to verify connectivity
3. Check backend API for data: `http://localhost:3001/api/sensors/esp32-001/latest`
4. View data in frontend dashboard
5. Add more devices by changing `device_id` and uploading to new ESP32s

## Support

For issues or questions:
- Check Serial Monitor output
- Review backend server logs
- Test MQTT connection with mosquitto_sub
- Verify network connectivity
