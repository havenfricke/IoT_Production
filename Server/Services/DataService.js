const dataRepository = require('../Repositories/DataRepository');
const Data = require('../Models/Data');

async function getAllData() {
  const rows = await dataRepository.getAllData();
  return rows.map(r => new Data(r.id, r.create_time, r.device_id, r.data_value));
}

async function getDataById(id) {
  const row = await dataRepository.getDataById(id);
  if (!row) throw new Error('Data not found');
  return new Data(row.id, row.create_time, row.device_id, row.data_value);
}

async function createData(body) {
  const created = await dataRepository.createData(body);
  return new Data(created.id, new Date(), body.deviceId, body.value);
}

async function editData(id, body) {
  const updated = await dataRepository.editData(id, body);
  return new Data(updated.id, null, null, updated.value);
}

async function deleteData(id) {
  return await dataRepository.deleteData(id);
}

module.exports = {
  getAllData,
  getDataById,
  createData,
  editData,
  deleteData
};
