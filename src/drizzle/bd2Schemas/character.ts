import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { CostumeTable } from "../bd2Schemas";
import { createdAt, id, updatedAt } from "../schemaUtils";

export const CharacterTable = sqliteTable(
    "character",
    {
        id,
        idChar: text("id_char").notNull(),
        name: text("name").notNull(),
        enName: text("en_name").notNull(),
        avatar: text("avatar"),
        atk: integer("atk"),
        matk: integer("matk"),
        def: integer("def"),
        mres: integer("mres"),
        hp: integer("hp"),
        critRate: integer("crit_rate"),
        critDmg: integer("crit_dmg"),
        deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
        createdAt,
        updatedAt,
    },
    (table) => [uniqueIndex("name").on(table.name)]
);

export const CharacterTableRelations = relations(CharacterTable, ({ many }) => {
    return {
        costumes: many(CostumeTable, { relationName: "costumes" }),
    };
});
