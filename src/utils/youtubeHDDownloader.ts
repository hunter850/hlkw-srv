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
        const cookies = process?.env?.YOUTUBE_COOKIE ? JSON.parse(process?.env?.YOUTUBE_COOKIE) : undefined;
        const agent = ytdl.createAgent(cookies);
        const info = await ytdl.getInfo(url, { agent });

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

            // 調試訊息
            // console.log("Video format:", {
            //     quality: bestVideo.qualityLabel,
            //     codec: bestVideo.videoCodec,
            //     hasUrl: !!bestVideo.url,
            // });
            // console.log("Audio format:", {
            //     codec: bestAudio.audioCodec,
            //     bitrate: bestAudio.audioBitrate,
            //     hasUrl: !!bestAudio.url,
            // });

            // 3. 設置回應 headers
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
            res.setHeader("Content-Type", "video/mp4");
            res.setHeader("Content-Disposition", `attachment; filename="${title}_HD.mp4"`);
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Accept-Ranges", "bytes");
            // 設置傳輸編碼為 chunked，讓客戶端知道這是流式傳輸
            res.setHeader("Transfer-Encoding", "chunked");

            // 4. 直接使用 URL 的簡化方法 (避免管道問題)
            const ffmpeg: ChildProcess = spawn(
                ffmpegPath!,
                [
                    // 輸入 1: 影片 URL
                    "-i",
                    bestVideo.url,
                    // 輸入 2: 音頻 URL
                    "-i",
                    bestAudio.url,
                    // 影片編碼：直接複製（YouTube的1080p通常已經是H.264）
                    "-c:v",
                    "copy",
                    // 音頻編碼：AAC with QuickTime 相容設定
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    "-ar",
                    "44100",
                    // 輸出格式 - 使用支援流式輸出的 MP4 設定
                    "-f",
                    "mp4",
                    // 流式 MP4 的 movflags
                    "-movflags",
                    "frag_keyframe+empty_moov",
                    // 輸出到 stdout
                    "-",
                ],
                {
                    stdio: ["pipe", "pipe", "pipe"],
                }
            );

            // 5. 改善的輸出處理
            if (ffmpeg.stdio && ffmpeg.stdio[2]) {
                // 不要讓客戶端斷開立即殺死 FFmpeg
                res.on("close", () => {
                    // 延遲殺死 FFmpeg，讓它有機會完成
                    setTimeout(() => {
                        console.log("Client disconnected (delayed), killing FFmpeg");
                        ffmpeg.kill();
                    }, 1000);
                });

                ffmpeg.stdout?.pipe(res);
            }

            // 7. 錯誤處理和進度監控
            let progressTimeout: NodeJS.Timeout | null = null;

            // 重設進度超時的函數
            const resetProgressTimeout = () => {
                if (progressTimeout) clearTimeout(progressTimeout);

                // 如果5分鐘內沒有新的輸出，認為FFmpeg卡住了
                progressTimeout = setTimeout(
                    () => {
                        console.log("FFmpeg appears stuck (no output for 5 minutes), killing process");
                        ffmpeg.kill("SIGKILL");
                        if (!res.headersSent) {
                            res.status(408).json({
                                success: false,
                                message: "Video processing appears stuck",
                            });
                        }
                    },
                    5 * 60 * 1000
                ); // 5分鐘無輸出超時
            };

            // 監控FFmpeg stderr獲取進度信息
            ffmpeg.stderr?.on("data", (data) => {
                const output = data.toString();
                // 重設進度超時（有輸出說明還在處理）
                resetProgressTimeout();

                // 可以解析進度信息（可選）
                if (output.includes("time=") || output.includes("frame=")) {
                    // console.log("FFmpeg progress:", output.match(/time=[\d\:\.]+/)?.[0]);
                }
            });

            // 監控stdout輸出（視頻數據）
            ffmpeg.stdout?.on("data", () => {
                resetProgressTimeout(); // 有視頻輸出，重設超時
            });

            // 初始設定進度超時
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

            // 處理回應錯誤
            res.on("error", (error: any) => {
                console.error("Response error:", error);
                ffmpeg.kill();
            });

            // 8. 智能超時處理 (根據影片長度動態調整)
            const videoDurationSeconds = parseInt(info.videoDetails.lengthSeconds) || 0;
            const estimatedProcessingTime = Math.max(
                videoDurationSeconds * 2, // 處理時間約為影片長度的2倍
                10 * 60 // 最少10分鐘
            );
            const maxTimeout = Math.min(estimatedProcessingTime, 45 * 60); // 最多45分鐘

            console.log(`Video duration: ${videoDurationSeconds}s, Timeout set to: ${maxTimeout}s`);

            const timeout = setTimeout(() => {
                console.log(`FFmpeg timeout after ${maxTimeout}s, killing process`);
                ffmpeg.kill("SIGKILL");
                if (!res.headersSent) {
                    res.status(408).json({
                        success: false,
                        message: `Video processing timeout (${Math.round(maxTimeout / 60)} minutes)`,
                    });
                }
            }, maxTimeout * 1000);

            // 9. 完成處理
            ffmpeg.on("close", (code, signal) => {
                clearTimeout(timeout);
                if (progressTimeout) clearTimeout(progressTimeout);
                console.log(`FFmpeg exited with code ${code}, signal ${signal}`);
                if (code === 0) {
                    console.log("FFmpeg completed successfully");
                    // 確保回應正確結束
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
