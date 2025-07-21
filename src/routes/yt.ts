import ytdl from "@distube/ytdl-core";
import { Router } from "express";
import type { Response } from "express";

import requestErrorHandler from "../modules/requestErrorHandler";
import type { RequestQuery } from "../types";
import { YouTubeHDDownloader } from "../utils/youtubeHDDownloader";

const router = Router();

// 用戶代理列表，用於反檢測
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

/**
 * 創建增強的 ytdl 選項配置以避免 429 錯誤
 */
function createEnhancedYtdlOptions() {
    const cookies = process?.env?.YOUTUBE_COOKIE ? JSON.parse(process?.env?.YOUTUBE_COOKIE) : undefined;
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const agent = ytdl.createAgent(cookies);

    return {
        agent,
        requestOptions: {
            headers: {
                "User-Agent": userAgent,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
            },
            timeout: 30000,
        },
    };
}

router.get("/video_info", async (req: RequestQuery<{ url?: string }>, res: Response) => {
    try {
        const url = req?.query?.url;
        if (!url) {
            res.status(400).json({ success: false, message: "Missing url" });
            return;
        }

        // 使用增強的配置來避免 429 錯誤
        const options = createEnhancedYtdlOptions();
        const [videoBasicInfo, videoInfo] = await Promise.all([
            ytdl.getBasicInfo(url, options),
            ytdl.getInfo(url, options),
        ]);
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

        const options = createEnhancedYtdlOptions();
        const videoStream = ytdl(url, {
            ...options,
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

        const options = createEnhancedYtdlOptions();
        const videoStream = ytdl(url, {
            ...options,
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
