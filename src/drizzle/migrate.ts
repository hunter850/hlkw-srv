import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

import { db as bd2Db } from "./dbs/bd2Db";
import { db as hololiveDb } from "./dbs/hololiveDb";

export const runMigrate = async () => {
    migrate(hololiveDb, {
        migrationsFolder: path.join(__dirname, "migrations/hololive"),
    });
    migrate(bd2Db, {
        migrationsFolder: path.join(__dirname, "migrations/bd2"),
    });
};
