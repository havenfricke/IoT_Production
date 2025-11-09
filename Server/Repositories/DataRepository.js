const db = require('../DB/DbConnection');

async function getAllData() {
  const sql = 'SELECT * FROM data_entries';
  return await db.query(sql, []);
}

async function getDataById(id) {
  const sql = 'SELECT * FROM data_entries WHERE id = ?';
  const result = await db.query(sql, [id]);
  return result[0]; // return exactly one
}

async function createData(id, body) {
  const sql = 'INSERT INTO data_entries (id, value) VALUES (?, ?)';
  await db.query(sql, [id, body.name]);
  return { id, name: body.name };
}

async function editData(id, body) {
  const sql = 'UPDATE data_entries SET value = ? WHERE id = ?';
  await db.query(sql, [body.value, id]);
  return { value: body.value, id };
}

async function deleteData(id) {
  const sql = 'DELETE FROM data_entries WHERE id = ?';
  const result = await db.query(sql, [id]);
  return result; 
}

module.exports = {
  getAllData,
  getDataById,
  createData,
  editData,
  deleteData
};
