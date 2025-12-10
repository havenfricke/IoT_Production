class GyroData {
  constructor(id, create_time, device_id, pitch_deg, roll_deg, yaw_deg) {
    this.id = id;
    this.createTime = create_time;
    this.deviceId = device_id;
    this.pitchDeg = pitch_deg;
    this.rollDeg = roll_deg;
    this.yawDeg = yaw_deg;
  }
}

module.exports = GyroData;
