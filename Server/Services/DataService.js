const dataRepository = require('../Repositories/DataRepository');
const Data = require('../Models/Data');

async function getAllData() {
  const rows = await dataRepository.getAllData();
  return rows.map(r => new Data(r.id, r.lidar_create_time, r.gyro_create_time, r.device_id, r.distance_cm, r.pitch_deg, r.roll_deg, r.yaw_deg));
}

async function getDataById(id) {
  const row = await dataRepository.getDataById(id);
  if (!row) throw new Error('Data not found');
  return new Data(row.id, row.lidar_create_time, row.gyro_create_time, row.device_id, row.distance_cm, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

// async function createData(body) {
//   const row = await dataRepository.createData(body); // returns full row
//   return new Data(row.id, row.lidar_create_time, row.gyro_create_time, row.device_id, row.distance_cm, row.pitch_deg, row.roll_deg, row.yaw_deg);
// }

async function editData(id, body) {
  const row = await dataRepository.editData(id, body);
  if (!row) throw new Error('Data not found');
  return new Data(row.id, row.lidar_create_time, row.gyro_create_time, row.device_id, row.distance_cm, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

async function deleteData(id) {
  return await dataRepository.deleteData(id);
}

module.exports = { getAllData, getDataById, editData, deleteData };