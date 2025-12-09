import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema";

// Create Neon connection
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle client with schema
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export { schema };
export * from "../shared/schema";
