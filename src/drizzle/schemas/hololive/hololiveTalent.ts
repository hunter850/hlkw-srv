import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { createdAt, id, updatedAt } from "../../schemaUtils";

export const HololiveTalentTable = sqliteTable(
    "hololive_talent",
    {
        id,
        name: text("name"),
        enName: text("en_name"),
        liveAvatar: text("live_avatar"),
        avatar: text("avatar"),
        status: text("status"),
        youtubeLink: text("youtube_link"),
        deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
        createdAt,
        updatedAt,
    },
    (table) => [uniqueIndex("name").on(table.name)]
);
