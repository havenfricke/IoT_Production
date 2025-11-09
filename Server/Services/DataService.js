const dataRepository = require('../Repositories/DataRepository');
const Data = require('../Models/Data');

async function getAllData(queryParams) {
  const data = await pageRepository.getAllData(queryParams);
  return data.map(data => new Data(data.id, data.name));
}

async function getDataById(id) {
  const data = await dataRepository.getDataById(id);
  if (!data) {
    throw new Error('data not found');
  }
  return new Data(data.id, data.name);
}

async function createData(body) {
  const created = await dataRepository.createData(id, body);
  return new Data(created.id, created.name);
}

async function editData(update) {
  const original = await DataRepository.getDataById(update.id);
  if (!original) {
    throw new Error("Data not found");
  }

  const updatedData = {
    name: update.name ? update.name : original.name
  };

  const updated = await DataRepository.editData(update.id, updatedData);
  return new Data(updated.id, updated.name);
}

async function deleteData(id) {
  const original = await DataRepository.getDataById(id);
  if (!original) {
    throw new Error("Data not found");
  }
  await DataRepository.deleteData(id);
  return { message: "Data deleted successfully" };
}

module.exports = {
  getAllData,
  getDataById,
  createData,
  editData,
  deleteData
};

// the service layer acts as the heart of your 
// application by housing the business logic, 
// making it easier to manage, test, and evolve 
// the application in line with business needs.
