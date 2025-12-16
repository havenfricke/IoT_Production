#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include <Wire.h>
#include <MPU6050_tockn.h>
#include <Servo.h>
#include <stdlib.h>

// ====== WIFI SETTINGS ======
char ssid[] = "NIGHTHAWK-2G";       
char pass[] = "ButtCheekOnAStick";  

// ====== HTTP / SERVER SETTINGS ======
const char server[] = "aws-production.onrender.com";
int port = 443;
const char lidarPath[] = "/data/lidar";
const char gyroPath[] = "/data/gyro";
const char* deviceId = "raft-uno-1";

WiFiSSLClient wifiSSLClient;
HttpClient client(wifiSSLClient, server, port);

// ====== SENSOR & SERVO OBJECTS ======
MPU6050 mpu(Wire); 
Servo yawServo;   // Pin 9 (Counter-steering)
Servo rollServo;  // Pin 10 (Counter-balancing)

// ====== HARDWARE SETTINGS ======
const int SERVO_PIN_YAW  = 9;
const int SERVO_PIN_ROLL = 10;
const int DEADZONE = 25; 

// ====== VARIABLES ======
float yawOffset  = 0; 
float rollOffset = 0; 
int lastDist = -1;

// ====== TIMER SETTINGS ======
unsigned long lastSendTime = 0;
// CHANGED: 5000ms = 5 seconds
const long sendInterval = 5000; 

// ====== FUNCTION DECLARATIONS ======
int readTFLuna();
void updateServos(float yaw, float roll);
void ensureWiFiConnected();
void sendJsonToServer(const char* path, const char* jsonBody);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== RAFT SYSTEM BOOT (5s DATA INTERVAL) ===");

  // 1. SOFT START SERVOS
  Serial.println("1. Locking Servos (Soft Start)...");
  yawServo.attach(SERVO_PIN_YAW);
  yawServo.write(90); 
  delay(500); 
  rollServo.attach(SERVO_PIN_ROLL);
  rollServo.write(90);
  delay(500); 

  // 2. CONNECT WIFI
  ensureWiFiConnected();

  // 3. INITIALIZE SENSORS
  Wire.begin();
  mpu.begin();
  
  Serial.println("3. Gyro Calibration (Don't Move)...");
  mpu.calcGyroOffsets(true); 
  
  Serial1.begin(115200); 
  
  // 4. MECHANICAL ZERO CALIBRATION
  Serial.println("4. Reading Mechanical Home (Leave raft still)...");
  float ySum = 0;
  float rSum = 0;
  int readings = 100;

  for (int i = 0; i < readings; i++) {
    mpu.update();
    ySum += mpu.getAngleZ(); 
    rSum += mpu.getAngleY(); 
    delay(10); 
  }

  yawOffset  = ySum / readings;
  rollOffset = rSum / readings;

  Serial.println("=== SYSTEM LIVE ===");
}

void loop() {
  // --- FAST LOOP (Runs constantly for smooth motors) ---
  // Note: We do NOT check WiFi here to save time. We only check before sending.
  
  mpu.update();
  
  // 1. Get Data
  float rawYaw  = mpu.getAngleZ();
  float rawRoll = mpu.getAngleY();
  int distance  = readTFLuna();

  // 2. Calculate Relative Angles
  float relYaw  = rawYaw  - yawOffset;
  float relRoll = rawRoll - rollOffset;

  // 3. Update Servos (Stabilization)
  updateServos(relYaw, relRoll);

  // --- SLOW LOOP (Runs every 5 seconds) ---
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= sendInterval) {
    lastSendTime = currentMillis;
    
    // Check WiFi only when we actually need to send
    ensureWiFiConnected();

    // --- BUILD JSON ---
    char pitchStr[16]; 
    char rollStr[16];
    char yawStr[16];

    dtostrf(mpu.getAngleX(), 1, 2, pitchStr); 
    dtostrf(relRoll,  1, 2, rollStr);         
    dtostrf(relYaw,   1, 2, yawStr);          

    char lidarBody[128];
    snprintf(lidarBody, sizeof(lidarBody),
             "{\"device_id\":\"%s\",\"distance_cm\":%d}",
             deviceId, distance);

    char gyroBody[192];
    snprintf(gyroBody, sizeof(gyroBody),
             "{\"device_id\":\"%s\","
             "\"pitch_deg\":%s,"
             "\"roll_deg\":%s,"
             "\"yaw_deg\":%s}",
             deviceId, pitchStr, rollStr, yawStr);

    // --- SEND TO SERVER ---
    Serial.println("\n--- UPLOADING TELEMETRY (5s Interval) ---");
    sendJsonToServer(lidarPath, lidarBody);
    sendJsonToServer(gyroPath,  gyroBody);
    Serial.println("---------------------------\n");
  }

  delay(50); // Small delay for servo smoothness
}

// ======= SERVO LOGIC (COUNTER-ACT) =======
void updateServos(float yaw, float roll) {
  // --- YAW (Counter-Steer) ---
  if (abs(yaw) > DEADZONE) {
    int yVal = map(yaw, -90, 90, 180, 0); 
    yVal = constrain(yVal, 0, 180); 
    yawServo.write(yVal);
  } else {
    yawServo.write(90); 
  }

  // --- ROLL (Counter-Balance) ---
  if (abs(roll) > DEADZONE) {
    int rVal = map(roll, -90, 90, 180, 0); 
    rVal = constrain(rVal, 0, 180);
    rollServo.write(rVal);
  } else {
    rollServo.write(90); 
  }
}

// ======= LIDAR =======
int readTFLuna() {
  while (Serial1.available() >= 9) {
    if (Serial1.read() == 0x59) {
      if (Serial1.read() == 0x59) {
        uint8_t frame[7];
        for (int i = 0; i < 7; i++) frame[i] = Serial1.read();
        int dist = frame[0] | (frame[1] << 8);
        if (dist > 0 && dist < 12000) lastDist = dist;
      }
    }
  }
  return lastDist;
}

// ======= WIFI HELPER =======
void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    // Safety: Center servos while we are blind
    yawServo.write(90);
    rollServo.write(90);
    
    int status = WL_IDLE_STATUS;
    while (status != WL_CONNECTED) {
      status = WiFi.begin(ssid, pass);
      delay(2000);
      Serial.print(".");
    }
    Serial.println("\nWiFi Online.");
  }
}

// ======= HTTP SENDER =======
void sendJsonToServer(const char* path, const char* jsonBody) {
  client.beginRequest();
  client.post(path);

  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Content-Length", strlen(jsonBody));

  client.beginBody();
  client.print(jsonBody);
  client.endRequest();

  int statusCode = client.responseStatusCode();
  // Read response to clear buffer, but don't block printing it unless needed
  String response = client.responseBody(); 

  Serial.print("POST ");
  Serial.print(path);
  Serial.print(" | Status: ");
  Serial.println(statusCode);
  
  client.stop(); 
}