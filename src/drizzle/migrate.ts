import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

import { db } from "./db";

export const runMigrate = async () => {
    migrate(db, {
        migrationsFolder: path.join(__dirname, "migrations"),
    });
};
