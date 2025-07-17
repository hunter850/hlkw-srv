import { Router } from "express";
// types
import type { Request, Response } from "express";
import path from "path";

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

export default router;
