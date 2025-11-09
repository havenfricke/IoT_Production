// Repositories/DataRepository.js
const db = require('../DB/DbConnection');

async function getById(id) {
  const sql = 'SELECT * FROM data_entries WHERE id = ?';
  const rows = await db.query(sql, [id]); 
  return rows[0];
}

async function getAllData() {
  const sql = 'SELECT * FROM data_entries ORDER BY create_time DESC';
  return await db.query(sql);
}

async function getDataById(id) {
  return await getById(id);
}

async function createData({ device_id, data_value }) {
  const sql = `
    INSERT INTO data_entries (create_time, device_id, data_value)
    VALUES (NOW(), ?, ?)
  `;
  const result = await db.query(sql, [device_id, data_value]);
  return await getById(result.insertId);
}

async function editData(id, { data_value }) {
  const sql = 'UPDATE data_entries SET data_value = ? WHERE id = ?';
  const result = await db.query(sql, [data_value, id]);
  const row = await getById(id);
  return row; 
}

async function deleteData(id) {
  const sql = 'DELETE FROM data_entries WHERE id = ?';
  await db.query(sql, [id]);
  return { id };
}

module.exports = { getAllData, getDataById, createData, editData, deleteData };
