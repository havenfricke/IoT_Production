const lidarDataRepository = require('../Repositories/LidarDataRepository');
const LidarData = require('../Models/LidarData');

async function getAllData() {
  const rows = await lidarDataRepository.getAllData();
  return rows.map(r => new LidarData(r.id, r.create_time, r.device_id, r.distance_cm));
}

async function getDataById(id) {
  const row = await lidarDataRepository.getDataById(id);
  if (!row) throw new Error('Data not found');
  return new LidarData(row.id, row.create_time, row.device_id, row.distance_cm);
}

async function createData(body) {
  const row = await lidarDataRepository.createData(body); // returns full row
  return new LidarData(row.id, row.create_time, row.device_id, row.distance_cm);
}

async function editData(id, body) {
  const row = await lidarDataRepository.editData(id, body);
  if (!row) throw new Error('Data not found');
  return new LidarData(row.id, row.create_time, row.device_id, row.distance_cm);
}

async function deleteData(id) {
  return await lidarDataRepository.deleteData(id);
}

module.exports = { getAllData, getDataById, createData, editData, deleteData };