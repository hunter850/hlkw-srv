import Database from "better-sqlite3";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";

import * as schema from "../bd2Schemas";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const dbPath =
    process.env.NODE_ENV === "development" ? path.resolve(process.cwd(), "db/bd2.db") : process.env.BD2_DB_PATH;

export const client = new Database(dbPath);
export const db = drizzle({ client: client, schema });
