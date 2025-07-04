import { Router } from "express";
import requestErrorHandler from "../modules/requestErrorHandler";
import TalentParser from "../modules/talentParser";
import { db } from "../drizzle/db";
import { HololiveTalentTable } from "../drizzle/schema";
import urlImageToS3 from "../utils/urlImageToS3";
import { eq } from "drizzle-orm";
// types
import type { Request, Response } from "express";

const router = Router();
const talentParser = new TalentParser();

router.get("/talent_list", async (_req: Request, res: Response) => {
    try {
        const newTalents = await talentParser.getTalentInfoList();
        const allTalentsInDb = await db.select().from(HololiveTalentTable).where(eq(HololiveTalentTable.deleted, false));
        // insert
        const talentsToAdd = newTalents.filter((talent) => {
            return typeof talent.name !== "string" ? false : !allTalentsInDb.map((talent) => talent.name).includes(talent.name);
        });
        if (talentsToAdd.length > 0) {
            const talentsToAddWithS3Image = await Promise.all(
                talentsToAdd.map((talent) => {
                    return new Promise<Partial<typeof HololiveTalentTable.$inferInsert>>((resolve, reject) => {
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
            // const columnSet = new pgp.helpers.ColumnSet(
            //     ["name", { name: "en_name", prop: "en_name" }, "live_avatar", "youtube_link", "status", "avatar"],
            //     { table: "hololive_talents" }
            // );
            // const insertSql = pgp.helpers.insert(talentsToAddWithS3Image, columnSet);
            // sqls.push(insertSql);
        }
        // delete
        // update

        // await db.insert(HololiveTalentTable).values(
        //     newTalents.map((newTalent) => {
        //         return {
        //             name: newTalent.name,
        //             enName: newTalent.en_name,
        //             liveAvatar: newTalent.live_avatar,
        //             avatar: newTalent.avatar,
        //             status: newTalent.status,
        //             youtubeLink: newTalent.youtube_link,
        //         };
        //     })
        // );
        // await hololiveTalentsController.upsertTalents(newTalents);
        res.status(200).json({ success: true, data: newTalents });
    } catch (error) {
        console.error("Error saving talent info:", error);
        requestErrorHandler(res, error);
    }
});

export default router;
