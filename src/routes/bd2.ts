import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { Router } from "express";
import path from "path";

import requestErrorHandler from "../modules/requestErrorHandler";
import type { RequestWithRawBuffer } from "../types";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const router = Router();

// 驗證 LINE 的簽名
function validateSignature(req: RequestWithRawBuffer) {
    const signature = req.headers["x-line-signature"];
    const body = req.rawBuffer;
    if (!body) {
        return false;
    }
    const hash = crypto.createHmac("SHA256", process.env.LINE_CHANNEL_SECRET!).update(body).digest("base64");

    return signature === hash;
}

// 發送純文字回覆訊息
async function replyPlainTextMessage(replyToken: string, message: string) {
    const url = "https://api.line.me/v2/bot/message/reply";

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };

    const body = {
        replyToken: replyToken,
        messages: [
            {
                type: "text",
                text: message,
            },
        ],
    };

    await axios.post(url, body, { headers });
}

interface LineMessageEvent {
    type: string;
    message: {
        type: string;
        id: string;
        quoteToken: string;
        text: string;
    };
    webhookEventId: string;
    deliveryContext: {
        isRedelivery: boolean;
    };
    timestamp: number;
    source: {
        type: string;
        userId: string;
    };
    replyToken: string;
    mode: string;
}

interface LineMessageBody {
    destination: string;
    events: LineMessageEvent[];
}

function calculateEquipLevel(levelString: string): number {
    // 驗證輸入長度
    if (levelString.length !== 3) {
        throw new Error("輸入字串長度必須為3");
    }

    // 分數對照表
    const scoreMap: { [key: string]: number } = {
        S: 4,
        A: 3,
        B: 2,
        C: 1,
    };

    // 位置權重 (由左到右分別乘以 1, 2, 3)
    const weights = [1, 2, 3];

    let totalScore = 0;

    // 計算每個位置的分數
    for (let i = 0; i < 3; i++) {
        const char = levelString[i].toUpperCase();

        // 驗證字元是否有效
        if (!(char in scoreMap)) {
            throw new Error(`無效字元 '${char}'，只能使用 S、A、B、C`);
        }

        totalScore += scoreMap[char] * weights[i];
    }

    return totalScore;
}

router.post("/webhooks/line", async (req: RequestWithRawBuffer<LineMessageBody>, res) => {
    try {
        if (!validateSignature(req)) {
            res.status(403).send("Invalid signature");
            return;
        }

        const events = req.body.events;
        await Promise.all(
            events.map(async (event) => {
                if (event.type === "message" && event.message.type === "text") {
                    const replyToken = event.replyToken;
                    const userMessage = event.message.text;
                    // 計算裝備 C 數
                    if (/^\/[cC]\s[SABC]{3}$/i.test(userMessage)) {
                        const equipString = userMessage.slice(3).toUpperCase(); // 提取後面3個字母
                        const level = calculateEquipLevel(equipString);
                        await replyPlainTextMessage(replyToken, `${level}C`);
                    }
                }
            })
        );

        res.status(200).send("OK");
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

export default router;
