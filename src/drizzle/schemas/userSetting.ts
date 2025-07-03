import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { uid } from "../schemaUtils";
import { UserTable } from "../schema";

export const UserSettingTable = sqliteTable("userSetting", {
    id: uid,
    setting: text("setting", { mode: "json" })
        .$type<{ theme?: "dark" | "light" | "system" }>()
        .notNull()
        .default({ theme: "system" }),
    userId: text("userId")
        .references(() => UserTable.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
});

export const UserSettingRelations = relations(UserSettingTable, ({ one }) => {
    return {
        user: one(UserTable, {
            fields: [UserSettingTable.userId],
            references: [UserTable.id],
        }),
    };
});