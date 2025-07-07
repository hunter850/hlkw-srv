import { eq } from "drizzle-orm";
import type { Response } from "express";

import { db } from "../drizzle/db";
import { buildConflictUpdateColumns } from "../drizzle/drizzle-utils";
import { HololiveTalentTable } from "../drizzle/schema";
import requestErrorHandler from "../modules/requestErrorHandler";
import urlImageToS3 from "../utils/urlImageToS3";
import TalentParser from "./talentParser";

const talentParser = new TalentParser();

async function updateTalents(res?: Response) {
    try {
        const newTalents = await talentParser.getTalentInfoList();
        const allTalentsInDb = await db
            .select()
            .from(HololiveTalentTable)
            .where(eq(HololiveTalentTable.deleted, false));
        const dbTalentNames = allTalentsInDb.map((talent) => talent.name);
        // insert
        const talentsToAdd = newTalents.filter((talent) => {
            return typeof talent.name !== "string" ? false : !dbTalentNames.includes(talent.name);
        });
        if (talentsToAdd.length > 0) {
            const talentsToAddWithS3Image = await Promise.all(
                talentsToAdd.map((talent) => {
                    return new Promise<
                        Omit<typeof HololiveTalentTable.$inferInsert, "id" | "createdAt" | "updatedAt" | "deleted">
                    >((resolve, reject) => {
                        (async () => {
                            try {
                                const [avatar, liveAvatar] = await Promise.all([
                                    urlImageToS3(talent.avatar),
                                    urlImageToS3(talent.live_avatar),
                                ]);
                                resolve({
                                    name: talent.name,
                                    enName: talent.en_name,
                                    liveAvatar,
                                    avatar,
                                    status: talent.status,
                                    youtubeLink: talent.youtube_link,
                                });
                            } catch (error) {
                                reject(error);
                            }
                        })();
                    });
                })
            );
            await db.insert(HololiveTalentTable).values(talentsToAddWithS3Image).returning();
        }
        // delete
        const talentsToDelete = allTalentsInDb.filter((talent) => {
            return typeof talent.name !== "string"
                ? false
                : !newTalents.map((talent) => talent.name).includes(talent.name);
        });
        if (talentsToDelete.length > 0) {
            await db
                .insert(HololiveTalentTable)
                .values(talentsToDelete.map((talent) => ({ ...talent, deleted: true })))
                .onConflictDoUpdate({
                    target: HololiveTalentTable.id,
                    set: buildConflictUpdateColumns(HololiveTalentTable, ["deleted"]),
                });
        }
        // update
        const talentsToUpdate = newTalents.filter((talent) => {
            return typeof talent.name !== "string" ? false : dbTalentNames.includes(talent.name);
        });
        if (talentsToUpdate.length > 0) {
            await db
                .insert(HololiveTalentTable)
                .values(
                    talentsToUpdate.map((talent) => ({
                        name: talent.name,
                        enName: talent.en_name,
                        status: talent.status,
                        youtubeLink: talent.youtube_link,
                    }))
                )
                .onConflictDoUpdate({
                    target: HololiveTalentTable.name,
                    set: buildConflictUpdateColumns(HololiveTalentTable, ["enName", "status", "youtubeLink"]),
                });
        }
        if (res) {
            res.status(200).json({ success: true, data: newTalents });
        }
    } catch (error) {
        console.error("Error updating talents:", error);
        if (res) {
            requestErrorHandler(res, error);
        }
    }
}

export default updateTalents;
