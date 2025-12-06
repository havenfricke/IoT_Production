const dataRepository = require('../Repositories/DataRepository');
const Data = require('../Models/Data');

function normalizeBody(body) {
  // accept either camelCase or snake_case, coerce to strings
  const device_id = (body.device_id ?? body.deviceId ?? '').toString();
  const data_value = (body.data_value ?? body.value ?? '').toString();
  if (!device_id) throw new Error('device_id is required');
  if (!data_value) throw new Error('data_value is required');
  if (device_id.length > 255 || data_value.length > 255) throw new Error('fields exceed 255 chars');
  return { device_id, data_value };
}

async function getAllData() {
  const rows = await dataRepository.getAllData();
  return rows.map(r => new Data(r.id, r.create_time, r.device_id, r.distance_cm, r.pitch_deg, r.roll_deg, r.yaw_deg));
}

async function getDataById(id) {
  const row = await dataRepository.getDataById(id);
  if (!row) throw new Error('Data not found');
  return new Data(row.id, row.create_time, row.device_id, row.distance_cm, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

async function createData(body) {
  const input = normalizeBody(body);
  const row = await dataRepository.createData(input); // returns full row
  return new Data(row.id, row.create_time, row.device_id, row.distance_cm, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

async function editData(id, body) {
  const input = normalizeBody(body); // we’ll allow updating data_value; device_id can be ignored or used
  const row = await dataRepository.editData(id, input);
  if (!row) throw new Error('Data not found');
  return new Data(row.id, row.create_time, row.device_id, row.distance_cm, row.pitch_deg, row.roll_deg, row.yaw_deg);
}

async function deleteData(id) {
  return await dataRepository.deleteData(id);
}

module.exports = { getAllData, getDataById, createData, editData, deleteData };