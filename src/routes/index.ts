import { Router } from "express";
import path from "path";
import { passwordAuth } from "../modules/auth";
import { eq, and } from "drizzle-orm";
import { db } from "../drizzle/db";
import { HololiveTalentTable } from "../drizzle/schema";
import requestErrorHandler from "../modules/requestErrorHandler";
import TalentParser from "../services/youtubeParser";
// types
import type { Request, Response } from "express";
import type { RequestBody, RequestQuery } from "../types";

const router = Router();

router.get("/now", (_req: Request, res: Response) => {
    try {
        const now = new Date().toISOString();
        res.status(200).json({ success: true, data: now });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message ?? "Unknown Error" });
    }
});

router.get("/download/db", (_req: Request, res: Response) => {
    try {
        const dbPath =
            process.env.NODE_ENV === "development" ? path.join(process.cwd(), "db", "sqlite.db") : process.env.DB_PATH!;
        res.download(dbPath, "sqlite.db", (err) => {
            if (err) {
                console.error("Download error:", err);
                if (!res.headersSent) {
                    res.status(404).json({ success: false, message: "Database file not found" });
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message ?? "Unknown Error" });
    }
});

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
