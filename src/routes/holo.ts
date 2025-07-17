import { and, eq } from "drizzle-orm";
import { Router } from "express";
// types
import type { Response } from "express";

import { db } from "../drizzle/db";
import { HololiveTalentTable } from "../drizzle/schema";
import { passwordAuth } from "../modules/auth";
import requestErrorHandler from "../modules/requestErrorHandler";
import TalentParser from "../services/youtubeParser";
import type { RequestBody, RequestQuery } from "../types";

const router = Router();

router.get("/talent_list", async (req: RequestQuery<{ id?: string }>, res) => {
    try {
        const { id } = req.query;
        if (id) {
            const talent = await db.query.HololiveTalentTable.findFirst({
                where: eq(HololiveTalentTable.id, Number(id)),
            });
            if (talent) {
                res.status(200).json({ success: true, data: talent });
            } else {
                res.status(404).json({ success: false, message: "Talent not found" });
            }
        } else {
            const talents = await db.select().from(HololiveTalentTable);
            res.status(200).json({ success: true, data: talents });
        }
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

type TalentListRequestBody = Omit<typeof HololiveTalentTable.$inferInsert, "id" | "createdAt" | "updatedAt"> & {
    createdAt: number | string;
    updatedAt: number | string;
};

router.post("/talent_list", passwordAuth, async (req: RequestBody<TalentListRequestBody[]>, res: Response) => {
    try {
        const insertData = req.body.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
        }));
        const talent = await db.insert(HololiveTalentTable).values(insertData);
        res.status(200).json({ success: true, data: talent });
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

router.get("/video_list", async (req: RequestQuery<{ id?: string }>, res: Response) => {
    try {
        if (typeof req.query?.id !== "string" || req.query?.id === "") {
            res.status(400).json({ success: false, message: "Missing id" });
            return;
        }
        const { id } = req.query;
        const talent = await db.query.HololiveTalentTable.findFirst({
            where: and(eq(HololiveTalentTable.id, Number(id)), eq(HololiveTalentTable.deleted, false)),
        });
        if (!talent) {
            res.status(404).json({ success: false, message: "Talent not found" });
            return;
        }
        if (talent.youtubeLink === null) {
            res.status(404).json({ success: false, message: "Talent has no youtube link" });
            return;
        }
        const talentParser = new TalentParser();
        const streamResult = await talentParser.parseStreams(talent.youtubeLink);
        const videos = talentParser.streamToVideos(streamResult);
        res.status(200).json({ success: true, data: videos });
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

export default router;
