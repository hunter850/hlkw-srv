import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { uid } from "../schemaUtils";
import { PostCategoryTable } from "../schema";

export const CategoryTable = sqliteTable("category", {
    id: uid,
    name: text("name", { length: 255 }).notNull(),
});

export const CategroyRelations = relations(CategoryTable, ({ many }) => {
    return {
        postCategories: many(PostCategoryTable, { relationName: "postCategories" }),
    };
});