const gyroDataRepository = require('../Repositories/GyroDataRepository');
const GyroData = require('../Models/GyroData');

async function getAllData() {
  const rows = await gyroDataRepository.getAllData();
  return rows.map(r => new GyroData(r.id, r.create_time, r.device_id, r.pitch_deg, r.roll_deg, r.yaw_deg));
}

async function getDataById(id) {
  const row = await gyroDataRepository.getDataById(id);
  if (!row) throw new Error('Data not found');
  return new GyroData(row.id, row.create_time, row.device_id, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

async function createData(body) {
  const row = await gyroDataRepository.createData(body); // returns full row
  return new GyroData(row.id, row.create_time, row.device_id, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

async function editData(id, body) {
  const row = await gyroDataRepository.editData(id, body);
  if (!row) throw new Error('Data not found');
  return new GyroData(row.id, row.create_time, row.device_id, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

async function deleteData(id) {
  return await gyroDataRepository.deleteData(id);
}

module.exports = { getAllData, getDataById, createData, editData, deleteData };