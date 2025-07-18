import ytdl from "@distube/ytdl-core";
import { Router } from "express";
import type { Response } from "express";

import requestErrorHandler from "../modules/requestErrorHandler";
import type { RequestQuery } from "../types";
import { YouTubeHDDownloader } from "../utils/youtubeHDDownloader";

const router = Router();

router.get("/video_info", async (req: RequestQuery<{ url?: string }>, res: Response) => {
    try {
        const url = req?.query?.url;
        if (!url) {
            res.status(400).json({ success: false, message: "Missing url" });
            return;
        }
        const [videoBasicInfo, videoInfo] = await Promise.all([ytdl.getBasicInfo(url), ytdl.getInfo(url)]);
        res.status(200).json({ success: true, data: { videoBasicInfo, videoInfo } });
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

router.get("/video", async (req: RequestQuery<{ url?: string }>, res: Response) => {
    try {
        const url = req?.query?.url;
        if (!url) {
            res.status(400).json({ success: false, message: "Missing url" });
            return;
        }

        // 設置下載視頻的 headers
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "no-cache");

        const videoStream = ytdl(url, {
            filter: (format) => ["1080p", "1080p 60", "1080p 60 HD"].includes(format.qualityLabel),
        });

        videoStream.pipe(res);
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

router.get("/video_stream", async (req: RequestQuery<{ url?: string }>, res: Response) => {
    try {
        const url = req?.query?.url;
        if (!url) {
            res.status(400).json({ success: false, message: "Missing url" });
            return;
        }

        // 設置視頻串流的 headers
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.setHeader("Content-Disposition", "inline");

        const videoStream = ytdl(url, {
            filter: (format) => ["1080p", "1080p 60", "1080p 60 HD"].includes(format.qualityLabel),
        });

        videoStream.pipe(res);
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

// 新增：下載 1080p HD 影片（影片+音頻合併）
router.get("/video_hd", async (req: RequestQuery<{ url?: string }>, res: Response) => {
    try {
        const url = req?.query?.url;
        if (!url) {
            res.status(400).json({ success: false, message: "Missing url" });
            return;
        }

        // 使用 YouTubeHDDownloader 下載並合併 HD 影片
        await YouTubeHDDownloader.downloadHD(url, res);
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

// 新增：獲取影片格式資訊
router.get("/video_formats", async (req: RequestQuery<{ url?: string }>, res: Response) => {
    try {
        const url = req?.query?.url;
        if (!url) {
            res.status(400).json({ success: false, message: "Missing url" });
            return;
        }

        const formatsInfo = await YouTubeHDDownloader.getFormatsInfo(url);
        res.status(200).json({ success: true, data: formatsInfo });
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

export default router;
