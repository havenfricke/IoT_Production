#include <Wire.h>
#include <MPU6050_tockn.h>
#include <Servo.h>

// ====== OBJECTS ======
MPU6050 mpu(Wire); 
Servo yawServo;   // Pin 9 (Counter-Steer)
Servo rollServo;  // Pin 10 (Counter-Balance)

// ====== HARDWARE SETTINGS ======
const int SERVO_PIN_YAW  = 9;
const int SERVO_PIN_ROLL = 10;
const int DEADZONE = 25; 

// ====== VARIABLES ======
float yawOffset  = 0; 
float rollOffset = 0; 
int lastDist = -1;

// ====== FUNCTIONS ======
int readTFLuna();
void updateServos(float yaw, float roll);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== RAFT R&D MODE (NO WIFI) ===");

  // 1. SOFT START SERVOS (Prevent Brownout)
  Serial.println("1. Locking Servos (Soft Start)...");
  yawServo.attach(SERVO_PIN_YAW);
  yawServo.write(90); 
  delay(500); 
  
  rollServo.attach(SERVO_PIN_ROLL);
  rollServo.write(90);
  delay(1000); // Wait for power to stabilize

  // 2. INITIALIZE SENSORS
  Wire.begin();
  mpu.begin();
  
  Serial.println("2. Gyro Calibration (Don't Move)...");
  mpu.calcGyroOffsets(true); 
  
  Serial1.begin(115200); 
  
  // 3. MECHANICAL ZERO CALIBRATION
  Serial.println("3. Reading Mechanical Home (Leave raft still)...");
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

  Serial.println("=== SYSTEM READY (STABILIZATION ACTIVE) ===");
}

void loop() {
  mpu.update();
  
  // 1. Get Data
  float rawYaw  = mpu.getAngleZ();
  float rawRoll = mpu.getAngleY();
  int distance  = readTFLuna();

  // 2. Calculate Relative Angles
  float relYaw  = rawYaw  - yawOffset;
  float relRoll = rawRoll - rollOffset;

  // 3. Update Servos
  updateServos(relYaw, relRoll);

  // 4. Debug Print
  Serial.print("Yaw: "); Serial.print(relYaw);
  Serial.print(" | Roll: "); Serial.print(relRoll);
  Serial.print(" | Dist: "); Serial.println(distance);

  delay(50); // Small delay for servo smoothness
}

// ======= SERVO LOGIC =======
void updateServos(float yaw, float roll) {
  
  // --- YAW (Pin 9) ---
  // Mapping: -90 -> 180 (Counter-Steer)
  if (abs(yaw) > DEADZONE) {
    int yVal = map(yaw, -90, 90, 180, 0); 
    yVal = constrain(yVal, 0, 180); 
    yawServo.write(yVal);
  } else {
    yawServo.write(90); 
  }

  // --- ROLL (Pin 10) ---
  // FLIPPED MAPPING: 0 -> 180 (Push AGAINST tilt)
  if (abs(roll) > DEADZONE) {
    int rVal = map(roll, -90, 90, 0, 180); 
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