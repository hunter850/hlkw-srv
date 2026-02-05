import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { createdAt, id, updatedAt } from "../../schemaUtils";

export const KnockBackDirectionTable = sqliteTable("knock_back_direction", {
    id,
    name: text("knock_back_direction", {
        enum: ["top", "left", "right", "bottom", "topLeft", "topRight", "bottomLeft", "bottomRight"],
    })
        .notNull()
        .default("top"),
    property: text("property", { enum: ["fire", "water", "wind", "light", "dark"] })
        .notNull()
        .default("fire"),
    image: text("image").notNull(),
    createdAt,
    updatedAt,
});
