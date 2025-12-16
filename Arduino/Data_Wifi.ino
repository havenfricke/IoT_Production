#include <WiFiNINA.h>
#include <Wire.h>
#include <MPU6050_tockn.h>
#include <stdlib.h>
#include <ArduinoHttpClient.h>

// ====== WIFI SETTINGS ======
char ssid[] = "NIGHTHAWK-2G";       //WiFi SSID
char pass[] = "ButtCheekOnAStick";  //WiFi password

// ====== HTTP / SERVER SETTINGS ======
const char server[] = "aws-production.onrender.com";
int port = 443;
const char lidarPath[] = "/data/lidar";
const char gyroPath[] = "/data/gyro";

WiFiSSLClient wifiSSLClient;
HttpClient client(wifiSSLClient, server, port);

// ====== SENSOR OBJECTS ======
MPU6050 mpu(Wire);  // MPU6050 on I2C (SDA/SCL)

// TF-Luna is on Serial1:
// On Uno WiFi Rev2: Serial1 RX = pin 0, TX = pin 1

int lastDist = -1;  // last good LiDAR distance (cm)

// ====== FUNCTION DECLARATIONS ======
int readTFLuna();
void ensureWiFiConnected();

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== SENSOR + WIFI TEST (NO HTTP) ===");

  // --------- Connect to WiFi ----------
  Serial.println("Connecting to WiFi...");
  int status = WL_IDLE_STATUS;
  while (status != WL_CONNECTED) {
    status = WiFi.begin(ssid, pass);
    delay(2000);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // --------- Initialize MPU6050 ----------
  Wire.begin();
  Serial.println("Initializing MPU6050...");
  mpu.begin();
  Serial.println("Calibrating gyro... keep still...");
  mpu.calcGyroOffsets(true);
  Serial.println("MPU6050 ready!\n");

  // --------- Initialize TF-Luna on Serial1 ----------
  Serial.println("Initializing TF-Luna LiDAR on Serial1...");
  Serial1.begin(115200);  // TF-Luna default UART baud
  Serial.println("TF-Luna ready!\n");
}

void loop() {
  ensureWiFiConnected();

  // ================================
  //         MPU6050 READ
  // ================================
  mpu.update();
  float pitch = mpu.getAngleX();
  float roll = mpu.getAngleY();
  float yaw = mpu.getAngleZ();

  // ================================
  //         TF-LUNA READ
  // ================================
  int distance = readTFLuna();

  // ---- Print raw values for debugging ----
  Serial.print("MPU6050  Pitch: ");
  Serial.print(pitch);
  Serial.print("  Roll: ");
  Serial.print(roll);
  Serial.print("  Yaw: ");
  Serial.println(yaw);

  Serial.print("TF-Luna Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // ================================
  //         BUILD JSON STRING
  // ================================
  char body[256];
  const char* deviceId = "raft-uno-1";

  // Convert floats to strings for JSON numeric fields
  char pitchStr[16];
  char rollStr[16];
  char yawStr[16];

  dtostrf(pitch, 1, 2, pitchStr);
  dtostrf(roll,  1, 2, rollStr);
  dtostrf(yaw,   1, 2, yawStr);

  // ---------- LIDAR JSON ----------
  char lidarBody[128];
  snprintf(lidarBody, sizeof(lidarBody),
           "{\"device_id\":\"%s\",\"distance_cm\":%d}",
           deviceId,
           distance);

  Serial.println("---- LIDAR JSON ----");
  Serial.println(lidarBody);

  // ---------- GYRO JSON ----------
  char gyroBody[192];
  snprintf(gyroBody, sizeof(gyroBody),
           "{\"device_id\":\"%s\","
           "\"pitch_deg\":%s,"
           "\"roll_deg\":%s,"
           "\"yaw_deg\":%s}",
           deviceId,
           pitchStr,
           rollStr,
           yawStr);

  Serial.println("---- GYRO JSON ----");
  Serial.println(gyroBody);
  Serial.println("----------------------\n");

  // ======== SEND TO SERVER ========
  sendJsonToServer(lidarPath, lidarBody);
  sendJsonToServer(gyroPath,  gyroBody);



  delay(1000);
}

// ======= TF-LUNA UART PARSER (Serial1) =======
int readTFLuna() {
  while (Serial1.available() >= 9) {
    if (Serial1.read() == 0x59) {
      if (Serial1.read() == 0x59) {
        uint8_t frame[7];
        for (int i = 0; i < 7; i++) {
          frame[i] = Serial1.read();
        }

        int dist = frame[0] | (frame[1] << 8);
        if (dist > 0 && dist < 12000) {
          lastDist = dist;
        }
      }
    }
  }
  return lastDist;
}

// ======= WIFI KEEP-ALIVE (NO HTTP) =======
void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    int status = WL_IDLE_STATUS;
    while (status != WL_CONNECTED) {
      status = WiFi.begin(ssid, pass);
      delay(2000);
      Serial.print(".");
    }
    Serial.println("\nReconnected to WiFi.");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  }
}

void sendJsonToServer(const char* path, const char* jsonBody) {
  ensureWiFiConnected();

  Serial.print("\nMaking POST request to ");
  Serial.println(path);

  client.beginRequest();
  client.post(path);

  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Content-Length", strlen(jsonBody));

  client.beginBody();
  client.print(jsonBody);
  client.endRequest();

  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);

  client.stop();
}
