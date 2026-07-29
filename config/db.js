
import mysql from 'mysql2' ;
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool that uses promises
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the promise-based pool
export default pool.promise();
