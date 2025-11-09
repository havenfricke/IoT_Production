const db = require('../DB/DbConnection');

async function getAllData() {
  const sql = 'SELECT * FROM data_entries ORDER BY create_time DESC';
  return await db.query(sql);
}

async function getDataById(id) {
  const sql = 'SELECT * FROM data_entries WHERE id = ?';
  const rows = await db.query(sql, [id]);
  return rows[0];
}

async function createData(body) {
  const sql = `
    INSERT INTO data_entries (create_time, device_id, data_value)
    VALUES (NOW(), ?, ?)
  `;
  const result = await db.query(sql, [body.deviceId, body.value]);
  return { id: result.insertId, ...body };
}

async function editData(id, body) {
  const sql = 'UPDATE data_entries SET data_value = ? WHERE id = ?';
  await db.query(sql, [body.value, id]);
  return { id, ...body };
}

async function deleteData(id) {
  const sql = 'DELETE FROM data_entries WHERE id = ?';
  await db.query(sql, [id]);
  return { id };
}

module.exports = {
  getAllData,
  getDataById,
  createData,
  editData,
  deleteData
};
