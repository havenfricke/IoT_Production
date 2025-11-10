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

  if (!result || !result.insertId) {
    throw new Error('Insert failed: no insertId returned'); // will surface as 500 unless mapped
  }
  const row = await getById(result.insertId);
  if (!row) {
    throw new Error(`Insert succeeded but row not found (id=${result.insertId})`);
  }
  return row;
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
