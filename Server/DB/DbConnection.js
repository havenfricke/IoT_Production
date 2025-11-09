const mysql = require('mysql2/promise');

let connection = null;

async function query(sql, params) {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.DB_CONNECTION_STRING,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      connectTimeout: 10000,  // 10 seconds
      ssl: { rejectUnauthorized: false }
    });
  }
  const [results] = await connection.execute(sql, params);
  return results;
}

module.exports = {
  query
};
