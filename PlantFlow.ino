#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <WiFiManager.h> 
#include <WiFiClientSecure.h>
// ===== MQTT CONFIG =====
const char* mqtt_server = "51a9817f28a14ffeac3a813af62bd55e.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;  
const char* mqtt_client_id = "plant_monitor_01";
const char* mqtt_topic_data = "plant/sensors/data";
const char* mqtt_topic_commands = "plant/commands/pump";
const char* mqtt_username = "sensor_user";
const char* mqtt_password = "Test_1234";

// ===== PINS =====
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 36
#define RELAY_PIN 26
#define I2C_SDA 21
#define I2C_SCL 22

// ===== SOIL CALIBRATION =====
#define SOIL_DRY  3000
#define SOIL_WET  1400

// ===== AUTOMATION SETTINGS =====
int soilThreshold = 40; // % влажност под който помпата се включва

// ===== OBJECTS =====
WiFiClientSecure espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
// ===== STATE VARIABLES =====
bool pumpState = false;       // реалното състояние на помпата
bool manualOverride = false;  // true ако потребителят е ръчно контролирал

// ===== FUNCTIONS =====
int readSoil() {
  int sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(SOIL_PIN);
    delay(5);
  }
  return sum / 10;
}

void mqttCallback(char* topic, byte* message, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) {
    msg += (char)message[i];
  }

  if (String(topic) == mqtt_topic_commands) {
    if (msg == "ON") {
      manualOverride = true;
      pumpState = true;
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("Pump turned ON (manual)");
    } 
    else if (msg == "OFF") {
      manualOverride = true;
      pumpState = false;
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("Pump turned OFF (manual)");
    }
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection... ");
    if (client.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      client.subscribe(mqtt_topic_commands);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
espClient.setInsecure(); // ⚠️ за тестове – приема всички сертификати

  // WiFiManager
  WiFiManager wifiManager;
  if (!wifiManager.autoConnect("ESP32_Setup", "12345678")) {
    Serial.println("Failed to connect and hit timeout");
    delay(3000);
    ESP.restart();
  }
  Serial.println("Connected to Wi-Fi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // по подразбиране помпата е изключена

  // ADC setup
  analogReadResolution(12);
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);

  // Sensors
  dht.begin();
  Wire.begin(I2C_SDA, I2C_SCL);
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);

  // MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

// ===== LOOP =====
void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  // ===== READ SENSORS =====
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  float lux = lightMeter.readLightLevel();
  int soilRaw = readSoil();
  int soilPercent = (SOIL_DRY - soilRaw) * 100 / (SOIL_DRY - SOIL_WET);
  soilPercent = constrain(soilPercent, 0, 100);

  // ===== AUTOMATIC CONTROL =====
  // ако влажността падне под threshold, автоматиката може да включи помпата отново
  if (manualOverride && soilPercent < soilThreshold) {
    manualOverride = false; // позволява автоматиката да включи
  }

  if (!manualOverride) {
    if (soilPercent < soilThreshold && !pumpState) {
      pumpState = true;
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("Pump turned ON (auto)");
    } else if (soilPercent >= soilThreshold && pumpState) {
      pumpState = false;
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("Pump turned OFF (auto)");
    }
  }

  // ===== PUBLISH JSON =====
  char payload[300];
  snprintf(payload, sizeof(payload),
    "{"
      "\"deviceId\":\"plant-esp32-01\","
      "\"temperature\":%.2f,"
      "\"humidity\":%.2f,"
      "\"soilMoisture\":%d,"
      "\"light\":%.2f,"
      "\"pump\":\"%s\""
    "}",
    temp, hum, soilPercent, lux,
    pumpState ? "ON" : "OFF"
  );

  if (client.publish(mqtt_topic_data, payload)) {
    Serial.println(payload);
  }

  delay(30000); // публикува на всеки 30 сек
}
