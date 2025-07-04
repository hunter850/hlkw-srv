import { Router } from "express";
// modules
import { passwordAuth } from "../modules/auth";
// types
import type { Request, Response } from "express";
import { db } from "../drizzle/db";
import { HololiveTalentTable } from "../drizzle/schema";
import type { RequestBody, RequestQuery } from "../types";
import requestErrorHandler from "../modules/requestErrorHandler";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/now", (_req: Request, res: Response) => {
    try {
        const now = new Date().toISOString();
        res.status(200).json({ success: true, data: now });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message ?? "Unknown Error" });
    }
});

router.get("/talent_list", async (req: RequestQuery<{ id?: string }>, res) => {
    try {
        const { id } = req.query;
        if (id) {
            const talent = await db
                .select()
                .from(HololiveTalentTable)
                .where(eq(HololiveTalentTable.id, Number(id)));
            if (talent.length === 0) {
                res.status(404).json({ success: false, message: "Talent not found" });
                return;
            }
            res.status(200).json({ success: true, data: talent });
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

export default router;
