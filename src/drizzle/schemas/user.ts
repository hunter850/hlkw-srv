import { sqliteTable, text, integer, uniqueIndex, unique } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { uid, createdAt, updatedAt } from "../schemaUtils";
import { UserPreferencesTable, PostTable, UserSettingTable } from "../schema";

export const UserTable = sqliteTable(
    "user",
    {
        id: uid,
        name: text("name", { length: 255 }).notNull(),
        age: integer("age").notNull(),
        // email: text("email", { length: 255 }).notNull().unique(),
        email: text("email", { length: 255 }).notNull(), // 因為用 uniqueIndex 所以可以省略 unique(), 如果用 index() 就不能省略
        // nickname: text("nickname", { length: 255 }),
        role: text("userRole", { enum: ["ADMIN", "BASIC"] })
            .notNull()
            .default("BASIC"),
        createdAt,
        updatedAt,
    },
    (table) => {
        return [uniqueIndex("emailIndex").on(table.email), unique("uniqueNameAndAge").on(table.name, table.age)];
    }
);

export const UserTableRelations = relations(UserTable, ({ one, many }) => {
    return {
        preferences: one(UserPreferencesTable),
        posts: many(PostTable, { relationName: "posts" }),
        setting: one(UserSettingTable),
    };
});