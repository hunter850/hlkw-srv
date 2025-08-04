import { Router } from "express";
import type { Request, Response } from "express";
import path from "path";

import type { RequestQuery } from "../types";

const router = Router();

router.get("/now", (_req: Request, res: Response) => {
    try {
        const now = new Date().toISOString();
        res.status(200).json({ success: true, data: now });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message ?? "Unknown Error" });
    }
});

router.get("/download_db", (req: RequestQuery<{ name: string }>, res: Response) => {
    try {
        if (!req.query.name) {
            res.status(400).json({ success: false, message: "Database name is required" });
            return;
        }

        const dbPath =
            process.env.NODE_ENV === "development"
                ? path.join(process.cwd(), "db", `${req.query.name}.db`)
                : `${process.env.DB_PATH}/${req.query.name}.db`;
        res.download(dbPath, `${req.query.name}.db`, (err) => {
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

export default router;
