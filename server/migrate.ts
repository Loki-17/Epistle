import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import fs from 'fs';
import path from 'path';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ 
  connectionString: "postgresql://neondb_owner:npg_Itdof9sv1Jac@ep-little-fog-a575wss9-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
});

async function migrate() {
  const client = await pool.connect();
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '0000_remarkable_boom_boom.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query(migration);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate().catch(console.error).finally(() => pool.end()); 