import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const dbPath = process.env.NODE_ENV === "development" ? path.resolve(process.cwd(), "db/sqlite.db") : process.env.DB_PATH;

export const client = new Database(dbPath);
export const db = drizzle({ client: client, schema });