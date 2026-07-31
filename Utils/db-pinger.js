import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DB_URI;

export async function pingAivenDatabase() {
  if (!connectionString) {
    console.warn("Aiven keep-alive skipped: No connection string found.");
    return;
  }

  // Create a temporary client just for the ping to avoid cluttering the main pool
  const pingClient = new Client({ 
  connectionString,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, '..', 'ca.pem')).toString() // Tells Node to trust Aiven
  }
});

  try {
    await pingClient.connect();
    await pingClient.query('SELECT 1;');
    console.log(`[${new Date().toISOString()}] Aiven DB keep-alive ping successful.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Aiven DB keep-alive ping failed:`, error.message);
  } finally {
    // close the connection immediately
    await pingClient.end().catch(() => {}); 
  }
      }
