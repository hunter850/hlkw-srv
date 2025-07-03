import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { uid } from "../schemaUtils";
import { UserTable, PostCategoryTable } from "../schema";

export const PostTable = sqliteTable("post", {
    id: uid,
    title: text("title", { length: 255 }).notNull(),
    averageRating: real("averageRating").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
        .$defaultFn(() => new Date())
        .notNull(),
    authorId: text("authorId")
        .references(() => UserTable.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
});

export const PostTableRelations = relations(PostTable, ({ one, many }) => {
    return {
        author: one(UserTable, {
            fields: [PostTable.authorId],
            references: [UserTable.id],
            relationName: "posts",
        }),
        postCategories: many(PostCategoryTable),
    };
});