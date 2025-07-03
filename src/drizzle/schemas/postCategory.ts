import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { PostTable, CategoryTable } from "../schema";

export const PostCategoryTable = sqliteTable(
    "postCategory",
    {
        postId: text("postId")
            .references(() => PostTable.id, { onDelete: "cascade", onUpdate: "cascade" })
            .notNull(),
        categoryId: text("categoryId")
            .references(() => CategoryTable.id, { onDelete: "cascade", onUpdate: "cascade" })
            .notNull(),
    },
    (table) => {
        return [primaryKey({ columns: [table.postId, table.categoryId], name: "pk" })];
    }
);

export const PostCategoryRelations = relations(PostCategoryTable, ({ one }) => {
    return {
        post: one(PostTable, {
            fields: [PostCategoryTable.postId],
            references: [PostTable.id],
            relationName: "posts",
        }),
        category: one(CategoryTable, {
            fields: [PostCategoryTable.categoryId],
            references: [CategoryTable.id],
            relationName: "postCategories",
        }),
    };
});