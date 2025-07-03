import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db";
import path from "path";

export const runMigrate = async () => {
  migrate(db, {
    migrationsFolder: path.join(__dirname, "migrations"),
  });
};
