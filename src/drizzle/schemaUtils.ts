import { text, integer } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

export const id = integer({ mode: "number" }).primaryKey({ autoIncrement: true });

export const uid = text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4());

export const createdAt = integer("createdAt", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull();

export const updatedAt = integer("updatedAt", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull();