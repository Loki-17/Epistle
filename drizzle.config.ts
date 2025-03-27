import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_7hcdTAYmR3FE@ep-autumn-dream-a5bh5bzj-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
});
