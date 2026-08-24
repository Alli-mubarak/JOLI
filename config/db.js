
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const globalForPg = global;

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Step up one level to reach the root directory where pg-ca.pem is located
const pgCaPath = path.join(__dirname, '..', 'pg-ca.pem');

  const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(pgCaPath).toString(),
  },
  max: 1,                 // Tight limit for free tier
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 20000, // Fail quickly (20s) instead of hanging indefinitely
};

export const pool = globalForPg.pgPool || new pg.Pool(dbConfig);

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;
  
