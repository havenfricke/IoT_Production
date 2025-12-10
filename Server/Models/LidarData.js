class LidarData {
  constructor(id, create_time, device_id, distance_cm) {
    this.id = id;
    this.createTime = create_time;
    this.deviceId = device_id;
    this.distanceCm = distance_cm;
  }
}

module.exports = LidarData;
