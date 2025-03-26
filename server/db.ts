import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;


export const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_Itdof9sv1Jac@ep-little-fog-a575wss9-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"});
export const db = drizzle({ client: pool, schema });
