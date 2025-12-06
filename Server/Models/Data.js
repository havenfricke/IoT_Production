class Data {
  constructor(id, create_time, device_id, distance_cm, pitch_deg, roll_deg, yaw_deg) {
    this.id = id;
    this.createTime = create_time;
    this.deviceId = device_id;
    this.distanceCm = distance_cm;
    this.pitchDeg = pitch_deg;
    this.rollDeg = roll_deg;
    this.yawDeg = yaw_deg;
  }
}

module.exports = Data;
