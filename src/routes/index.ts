import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

import { passwordAuth } from "../modules/auth";
import { uploadSingle } from "../modules/fileUpload";
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

router.post("/upload_db", passwordAuth, uploadSingle("file"), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: "No file uploaded" });
            return;
        }

        // 檢查檔案是否為 .db 檔案
        if (!req.file.originalname.toLowerCase().endsWith(".db")) {
            res.status(400).json({ success: false, message: "Only .db files are allowed" });
            return;
        }

        // 確保目標資料夾存在
        const targetDir = process.env.NODE_ENV === "development" ? path.join(process.cwd(), "db") : process.env.DB_PATH;

        if (!targetDir) {
            res.status(500).json({ success: false, message: "DB_PATH environment variable is not set" });
            return;
        }

        // 確保目錄存在
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 建立完整的檔案路徑
        const filePath = path.join(targetDir, req.file.originalname);

        // 檢查檔案是否已存在，如果存在就備份舊檔案
        let backupInfo = null;
        if (fs.existsSync(filePath)) {
            const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
            const fileExt = path.extname(req.file.originalname);
            const fileBaseName = path.basename(req.file.originalname, fileExt);
            const backupFileName = `${fileBaseName}_${timestamp}${fileExt}`;
            const backupPath = path.join(targetDir, backupFileName);

            // 重新命名舊檔案
            fs.renameSync(filePath, backupPath);
            backupInfo = {
                originalExists: true,
                backupFilename: backupFileName,
                backupPath: backupPath,
            };
            console.log(`Existing file backed up as: ${backupFileName}`);
        }

        // 寫入新檔案
        fs.writeFileSync(filePath, req.file.buffer);

        const responseData: any = {
            filename: req.file.originalname,
            size: req.file.size,
            path: filePath,
        };

        if (backupInfo) {
            responseData.backup = backupInfo;
        }

        res.status(200).json({
            success: true,
            message: backupInfo
                ? `Database file uploaded successfully. Previous file backed up as ${backupInfo.backupFilename}`
                : "Database file uploaded successfully",
            data: responseData,
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: error?.message ?? "Upload failed" });
    }
});

export default router;
