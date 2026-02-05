import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { createdAt, id, updatedAt } from "../../schemaUtils";
import { CostumeTable, KnockBackDirectionTable } from "../bd2";

export const CharacterTable = sqliteTable(
    "character",
    {
        id,
        idChar: text("id_char").notNull(),
        name: text("name").notNull(),
        enName: text("en_name").notNull(),
        avatar: text("avatar"),
        property: text("property", { enum: ["fire", "water", "wind", "light", "dark"] })
            .notNull()
            .default("fire"),
        attackWay: text("attack_way", { enum: ["front", "skip"] })
            .notNull()
            .default("front"),
        knockBackDirection: integer("knock_back_direction")
            .notNull()
            .references(() => KnockBackDirectionTable.id)
            .default(1),
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

export const CharacterTableRelations = relations(CharacterTable, ({ many, one }) => {
    return {
        costumes: many(CostumeTable, { relationName: "costumes" }),
        knockBackDirection: one(KnockBackDirectionTable, {
            fields: [CharacterTable.knockBackDirection],
            references: [KnockBackDirectionTable.id],
            relationName: "knockBackDirection",
        }),
    };
});
