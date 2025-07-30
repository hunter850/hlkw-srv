import dotenv from "dotenv";
import { Router } from "express";
import path from "path";

import lineSignatureValidater from "../modules/lineSignatureValidater";
import requestErrorHandler from "../modules/requestErrorHandler";
import type { RequestWithRawBuffer } from "../types";
import calculateBD2EquipLevel from "../utils/calculateBD2EquipLevel";
import replyPlainTextLineMessage from "../utils/replyPlainTextLineMessage";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const router = Router();
export interface LineMessageEvent {
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
        groupId?: string;
    };
    replyToken: string;
    mode: string;
}

export interface LineMessageBody {
    destination: string;
    events: LineMessageEvent[];
}

const lineMessageDeciders: {
    regexp: RegExp;
    reply: (replyToken: string, userMessage: string) => Promise<void>;
}[] = [
    {
        // 計算裝備 C 數
        regexp: /^\/[cC]\s[SABC]{3}$/i,
        reply: async (replyToken: string, userMessage: string) => {
            // 提取後面3個字母
            const equipString = userMessage.slice(3).toUpperCase();
            const level = calculateBD2EquipLevel(equipString);
            await replyPlainTextLineMessage(replyToken, `${level}C`);
        },
    },
    {
        // 幫助指令
        regexp: /^\/([hH](elp(er)?)?|!|幫助|(小)?幫手)$/,
        reply: async (replyToken: string) => {
            const helpMessage = `可用指令：
/c SAB - 計算裝備 C 數
範例：/c SAA`;
            await replyPlainTextLineMessage(replyToken, helpMessage);
        },
    },
];

router.post("/webhooks/line", lineSignatureValidater, async (req: RequestWithRawBuffer<LineMessageBody>, res) => {
    try {
        const events = req.body.events;
        await Promise.all(
            events.map(async (event) => {
                if (event.type === "message" && event.message.type === "text") {
                    const replyToken = event.replyToken;
                    const userMessage = event.message.text;
                    for (const decider of lineMessageDeciders) {
                        if (decider.regexp.test(userMessage)) {
                            await decider.reply(replyToken, userMessage);
                            break;
                        }
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
