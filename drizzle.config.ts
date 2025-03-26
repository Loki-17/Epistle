import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_Itdof9sv1Jac@ep-little-fog-a575wss9-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
});
