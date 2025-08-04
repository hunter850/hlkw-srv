import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, id, updatedAt } from "../../schemaUtils";
import { CharacterTable } from "../bd2";

export const CostumeTable = sqliteTable("costume", {
    id,
    idCostume: text("id_costume").notNull(),
    costumeName: text("costume_name").notNull(),
    costumeAvatar: text("costume_avatar"),
    sp: integer("sp"),
    cd: integer("cd"),
    chain: text("chain"),
    characterId: integer("character_id")
        .notNull()
        .references(() => CharacterTable.id),
    createdAt,
    updatedAt,
});

export const CostumeTableRelations = relations(CostumeTable, ({ one }) => ({
    character: one(CharacterTable, {
        fields: [CostumeTable.characterId],
        references: [CharacterTable.id],
        relationName: "costumes",
    }),
}));
