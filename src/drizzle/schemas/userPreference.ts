import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { uid } from "../schemaUtils";
import { UserTable } from "../schema";

export const UserPreferencesTable = sqliteTable("userPreferences", {
    id: uid,
    emailUpdates: integer("emailUpdates", { mode: "boolean" }).notNull().default(false),
    userId: text("userId")
        .references(() => UserTable.id, { onDelete: "cascade" })
        .notNull(),
});

export const UserPreferencesTableRelations = relations(UserPreferencesTable, ({ one }) => {
    return {
        user: one(UserTable, {
            fields: [UserPreferencesTable.userId],
            references: [UserTable.id],
        }),
    };
});