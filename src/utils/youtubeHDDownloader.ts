import ytdl from "@distube/ytdl-core";
import { ChildProcess, spawn } from "child_process";
import dotenv from "dotenv";
import type { Response } from "express";
import ffmpegPath from "ffmpeg-static";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * YouTube HD 下載器 - 使用 ffmpeg-static 跨平台 FFmpeg
 * 完美支援 Render、Vercel、Heroku 等雲端平台
 */
export class YouTubeHDDownloader {
    // 用戶代理列表
    private static userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];

    /**
     * 獲取隨機用戶代理
     */
    private static getRandomUserAgent(): string {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    /**
     * 創建增強的 ytdl 選項配置
     */
    private static createYtdlOptions() {
        const cookies = process?.env?.YOUTUBE_COOKIE ? JSON.parse(process?.env?.YOUTUBE_COOKIE) : undefined;
        const userAgent = this.getRandomUserAgent();

        const agent = ytdl.createAgent(cookies);

        const options = {
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

        return options;
    }

    /**
     * 檢查 ffmpeg-static 是否可用
     */
    static async checkFFmpeg(): Promise<boolean> {
        return new Promise((resolve) => {
            if (!ffmpegPath) {
                resolve(false);
                return;
            }
            const ffmpeg = spawn(ffmpegPath, ["-version"]);
            ffmpeg.on("close", (code) => resolve(code === 0));
            ffmpeg.on("error", () => resolve(false));
        });
    }

    /**
     * 獲取最佳的影片和音頻格式
     */
    static async getBestFormats(url: string) {
        const options = this.createYtdlOptions();
        const info = await ytdl.getInfo(url, options);

        // 取得所有影片格式（僅影片，無音頻）
        const videoFormats = ytdl.filterFormats(info.formats, "videoonly");
        // 取得所有音頻格式
        const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

        // 按畫質排序，優先選擇 1080p
        const sortedVideoFormats = videoFormats.sort((a, b) => {
            const aHeight = a.height || 0;
            const bHeight = b.height || 0;
            return bHeight - aHeight; // 降序排列
        });

        // 選擇最佳影片格式 (1080p 或最高可用畫質)
        const bestVideo =
            sortedVideoFormats.find((f) => f.qualityLabel?.includes("1080p") && f.hasVideo) || sortedVideoFormats[0];

        // 選擇最佳音頻格式
        const bestAudio =
            audioFormats.find((f) => f.audioCodec?.startsWith("mp4a") && f.hasAudio) ||
            audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

        return { bestVideo, bestAudio, info };
    }

    /**
     * 下載並合併 HD 影片 (主要方法)
     */
    static async downloadHD(url: string, res: Response): Promise<void> {
        try {
            // 1. 檢查 ffmpeg-static
            if (!ffmpegPath) {
                throw new Error("ffmpeg-static not installed. Please install: pnpm add ffmpeg-static");
            }

            const hasFFmpeg = await this.checkFFmpeg();
            if (!hasFFmpeg) {
                throw new Error("FFmpeg binary not working. Please reinstall ffmpeg-static.");
            }

            // 2. 獲取最佳格式
            const { bestVideo, bestAudio, info } = await this.getBestFormats(url);

            if (!bestVideo || !bestAudio) {
                throw new Error("Unable to find suitable video or audio formats");
            }

            if (!bestVideo.url || !bestAudio.url) {
                throw new Error("Video or audio format URL is missing");
            }

            // 3. 設置回應 headers
            const title = info.videoDetails.title.replace(/[^\w\s\u4e00-\u9fff]/gi, "");
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(title)}_HD.mp4"`);
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Transfer-Encoding", "chunked");

            // 4. FFmpeg 處理
            const ffmpeg: ChildProcess = spawn(
                ffmpegPath!,
                [
                    "-user_agent",
                    this.getRandomUserAgent(),
                    "-i",
                    bestVideo.url,
                    "-i",
                    bestAudio.url,
                    "-c:v",
                    "copy",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    "-ar",
                    "44100",
                    "-f",
                    "mp4",
                    "-movflags",
                    "frag_keyframe+empty_moov",
                    "-loglevel",
                    "warning",
                    "-",
                ],
                {
                    stdio: ["pipe", "pipe", "pipe"],
                }
            );

            // 5. 輸出處理
            if (ffmpeg.stdout) {
                res.on("close", () => {
                    setTimeout(() => {
                        console.log("Client disconnected, killing FFmpeg");
                        ffmpeg.kill();
                    }, 1000);
                });

                ffmpeg.stdout.pipe(res);
            }

            // 6. 錯誤處理和進度監控
            let progressTimeout: NodeJS.Timeout | null = null;

            const resetProgressTimeout = () => {
                if (progressTimeout) clearTimeout(progressTimeout);
                progressTimeout = setTimeout(
                    () => {
                        console.log("FFmpeg timeout, killing process");
                        ffmpeg.kill("SIGKILL");
                        if (!res.headersSent) {
                            res.status(408).json({
                                success: false,
                                message: "Video processing timeout",
                            });
                        }
                    },
                    5 * 60 * 1000
                );
            };

            ffmpeg.stderr?.on("data", () => {
                resetProgressTimeout();
            });

            ffmpeg.stdout?.on("data", () => {
                resetProgressTimeout();
            });

            resetProgressTimeout();

            ffmpeg.on("error", (error: any) => {
                console.error("FFmpeg error:", error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: "Video processing failed",
                        error: error.message,
                    });
                }
            });

            res.on("error", (error: any) => {
                console.error("Response error:", error);
                ffmpeg.kill();
            });

            // 7. 智能超時處理
            const videoDurationSeconds = parseInt(info.videoDetails.lengthSeconds) || 0;
            const estimatedProcessingTime = Math.max(videoDurationSeconds * 2, 10 * 60);
            const maxTimeout = Math.min(estimatedProcessingTime, 45 * 60);

            const timeout = setTimeout(() => {
                console.log(`FFmpeg timeout after ${maxTimeout}s`);
                ffmpeg.kill("SIGKILL");
                if (!res.headersSent) {
                    res.status(408).json({
                        success: false,
                        message: `Video processing timeout (${Math.round(maxTimeout / 60)} minutes)`,
                    });
                }
            }, maxTimeout * 1000);

            // 8. 完成處理
            ffmpeg.on("close", (code, signal) => {
                clearTimeout(timeout);
                if (progressTimeout) clearTimeout(progressTimeout);
                console.log(`FFmpeg exited with code ${code}, signal ${signal}`);
                if (code === 0) {
                    console.log("FFmpeg completed successfully");
                    if (!res.finished) {
                        res.end();
                    }
                } else {
                    console.error(`FFmpeg exited with non-zero code: ${code}`);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: `FFmpeg processing failed with code ${code}`,
                        });
                    }
                }
            });
        } catch (error: any) {
            console.error("Download HD error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        }
    }

    /**
     * 獲取可用格式信息（用於調試）
     */
    static async getFormatsInfo(url: string) {
        try {
            const { bestVideo, bestAudio, info } = await this.getBestFormats(url);

            return {
                title: info.videoDetails.title,
                duration: info.videoDetails.lengthSeconds,
                selectedVideo: {
                    quality: bestVideo?.qualityLabel,
                    codec: bestVideo?.videoCodec,
                    fps: bestVideo?.fps,
                    bitrate: bestVideo?.bitrate,
                },
                selectedAudio: {
                    codec: bestAudio?.audioCodec,
                    bitrate: bestAudio?.audioBitrate,
                    sampleRate: bestAudio?.audioSampleRate,
                },
                availableQualities: ytdl.filterFormats(info.formats, "videoonly").map((f) => ({
                    quality: f.qualityLabel,
                    codec: f.videoCodec,
                    hasAudio: f.hasAudio,
                    hasVideo: f.hasVideo,
                })),
            };
        } catch (error: any) {
            throw new Error(`Failed to get formats info: ${error.message}`);
        }
    }
}
