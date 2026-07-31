import { Client } from 'pg';

const connectionString = process.env.DB_URI;

async function pingDatabase() {
  if (!connectionString) {
    console.warn("Aiven keep-alive skipped: No connection string found.");
    return;
  }

  // Create a temporary client just for the ping to avoid cluttering the main pool
  const pingClient = new Client({ connectionString });

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
