// Repositories/DataRepository.js
const db = require('../DB/DbConnection');

async function getById(id) {
  const sql = 'SELECT * FROM lidar_data_entries WHERE id = ?';
  const rows = await db.query(sql, [id]); 
  return rows[0];
}

async function getAllData() {
  const sql = 'SELECT * FROM lidar_data_entries ORDER BY create_time DESC';
  return await db.query(sql);
}

async function getDataById(id) {
  return await getById(id);
}

async function createData({ device_id, distance_cm }) {
  const sql = `
    INSERT INTO lidar_data_entries (create_time, device_id, distance_cm)
    VALUES (NOW(), ?, ?)
  `;
  const result = await db.query(sql, [device_id, distance_cm]);

  if (!result || !result.insertId) {
    throw new Error('Insert failed: no insertId returned'); // will surface as 500 unless mapped
  }
  const row = await getById(result.insertId);
  if (!row) {
    throw new Error(`Insert succeeded but row not found (id=${result.insertId})`);
  }
  return row;
}

async function editData(id, { device_id }) {
  const sql = 'UPDATE lidar_data_entries SET device_id = ? WHERE id = ?';
  const result = await db.query(sql, [device_id, id]);
  const row = await getById(id);
  return row; 
}

async function deleteData(id) {
  const sql = 'DELETE FROM lidar_data_entries WHERE id = ?';
  await db.query(sql, [id]);
  return { id };
}

module.exports = { getAllData, getDataById, createData, editData, deleteData };
