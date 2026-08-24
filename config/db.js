
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Step up one level to reach the root directory where pg-ca.pem is located
const pgCaPath = path.join(__dirname, '..', 'pg-ca.pem');

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(pgCaPath).toString(),
  },
  max: 3,                 // Tight limit for free tier
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 20000, // Fail quickly (20s) instead of hanging indefinitely
});
