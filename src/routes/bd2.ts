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

// 發送回覆訊息
async function replyMessage(replyToken: string, message: string) {
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

router.post("/webhooks/line", async (req: RequestWithRawBuffer, res) => {
    try {
        if (!validateSignature(req)) {
            res.status(403).send("Invalid signature");
            return;
        }

        const events = req.body.events;

        await Promise.all(
            events.map(async (event: any) => {
                if (event.type === "message" && event.message.type === "text") {
                    const replyToken = event.replyToken;
                    const userMessage = event.message.text;
                    await replyMessage(replyToken, `你說了：${userMessage}`);
                }
            })
        );

        res.status(200).send("OK");
    } catch (error: any) {
        requestErrorHandler(res, error);
    }
});

export default router;
