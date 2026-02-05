import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, id, updatedAt } from "../../schemaUtils";
import { CharacterTable } from "../bd2";

export type CostumeLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type Skill = { skillDescription: string; sp: number; cd: number; chain: number };
export type SkillPotential = {
    potentialIcon: string;
    potentialDescription: string;
    sp: number;
    cd: number;
    chain: number;
    range: string;
};

export const CostumeTable = sqliteTable("costume", {
    id,
    idCostume: text("id_costume").notNull(),
    costumeName: text("costume_name").notNull(),
    costumeAvatar: text("costume_avatar"),
    sp: integer("sp"),
    cd: integer("cd"),
    chain: integer("chain"),
    characterId: integer("character_id")
        .notNull()
        .references(() => CharacterTable.id),
    skill: text("skill", { mode: "json" })
        .$type<Record<CostumeLevel, Skill>>()
        .notNull()
        .default({
            0: { skillDescription: "", sp: 0, cd: 0, chain: 0 },
            1: { skillDescription: "", sp: 0, cd: 0, chain: 0 },
            2: { skillDescription: "", sp: 0, cd: 0, chain: 0 },
            3: { skillDescription: "", sp: 0, cd: 0, chain: 0 },
            4: { skillDescription: "", sp: 0, cd: 0, chain: 0 },
            5: { skillDescription: "", sp: 0, cd: 0, chain: 0 },
        }),
    skillRange: text("skill_range").notNull().default(""),
    skillPotential: text("skill_potential", { mode: "json" }).$type<SkillPotential[]>().notNull().default([]),
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
