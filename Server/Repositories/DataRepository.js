// Repositories/DataRepository.js
const db = require('../DB/DbConnection');

async function getAllData() {
  const sql = `
    SELECT
      l.id,
      l.device_id,
      l.create_time AS lidar_create_time,
      g.create_time AS gyro_create_time,
      l.distance_cm,
      g.pitch_deg,
      g.roll_deg,
      g.yaw_deg
    FROM lidar_data_entries AS l
    JOIN gyro_data_entries AS g ON g.id = l.id
    ORDER BY g.create_time DESC
  `;
  const rows = await db.query(sql);
  return rows;
}

async function getDataById(id) {
  const sql = `
  SELECT
      l.id,
      l.device_id,
      l.create_time AS lidar_create_time,
      g.create_time AS gyro_create_time,
      l.distance_cm,
      g.pitch_deg,
      g.roll_deg,
      g.yaw_deg
  FROM lidar_data_entries AS l
  JOIN gyro_data_entries AS g ON g.id = l.id
  WHERE l.id = ?
  `;
  const rows = await db.query(sql, [id]); 
  return rows[0];
}

// async function createData({ device_id, distance_cm, pitch_deg, roll_deg, yaw_deg }) {
//   const sql = `
//     INSERT INTO data_entries (create_time, device_id, distance_cm, pitch_deg, roll_deg, yaw_deg)
//     VALUES (NOW(), ?, ?, ?, ?, ?)
//   `;
//   const result = await db.query(sql, [device_id, distance_cm, pitch_deg, roll_deg, yaw_deg]);

//   if (!result || !result.insertId) {
//     throw new Error('Insert failed: no insertId returned'); // will surface as 500 unless mapped
//   }
//   const row = await getById(result.insertId);
//   if (!row) {
//     throw new Error(`Insert succeeded but row not found (id=${result.insertId})`);
//   }
//   return row;
// }

async function editData(id, { device_id }) {
  await db.query(
    `UPDATE gyro_data_entries SET device_id = ? WHERE id = ?`,
    [device_id, id]
  );

  await db.query(
    `UPDATE lidar_data_entries SET device_id = ? WHERE id = ?`,
    [device_id, id]
  );

  return getDataById(id);
}


async function deleteData(id) {
  await db.query(`DELETE FROM gyro_data_entries WHERE id = ?`, [id]);
  await db.query(`DELETE FROM lidar_data_entries WHERE id = ?`, [id]);
  return { id };
}


module.exports = { getAllData, getDataById, editData, deleteData };
