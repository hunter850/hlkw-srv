import dotenv from "dotenv";
import { like, or } from "drizzle-orm";
import { Router } from "express";
import path from "path";

import { CharacterTable } from "../drizzle/bd2Schemas/character";
import { db } from "../drizzle/dbs/bd2Db";
import lineSignatureValidater from "../modules/lineSignatureValidater";
import requestErrorHandler from "../modules/requestErrorHandler";
import type { RequestWithRawBuffer } from "../types";
import calculateBD2EquipLevel from "../utils/calculateBD2EquipLevel";
import replyCarouselLineMessage from "../utils/replyCarouselLineMessage";
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
        // 查詢角色資訊
        regexp: /^\/(?:角色|character)\s+(.+)$/i,
        reply: async (replyToken: string, userMessage: string) => {
            // 提取角色名字
            const match = userMessage.match(/^\/(?:角色|character)\s+(.+)$/i);
            if (match) {
                const characterName = match[1].trim();

                try {
                    // 對 name 和 enName 進行模糊搜尋
                    const characters = await db
                        .select()
                        .from(CharacterTable)
                        .where(
                            or(
                                like(CharacterTable.name, `%${characterName}%`),
                                like(CharacterTable.enName, `%${characterName}%`)
                            )
                        )
                        .limit(10); // 限制結果數量避免過多

                    if (characters.length === 0) {
                        await replyPlainTextLineMessage(replyToken, `找不到匹配的角色：${characterName}`);
                        return;
                    }

                    const columns = characters.map((char) => ({
                        thumbnailImageUrl: char.avatar || undefined,
                        title: char.name,
                        text: `${char.enName}\n攻擊：${char.atk || "?"} 血量：${char.hp || "?"}`,
                        actions: [
                            {
                                type: "postback" as const,
                                label: "查看詳情",
                                data: `character_${char.id}`,
                            },
                            {
                                type: "message" as const,
                                label: "選擇此角色",
                                text: `/角色 ${char.name}`,
                            },
                        ],
                    }));

                    await replyCarouselLineMessage(replyToken, `找到 ${characters.length} 個匹配的角色`, columns);
                } catch (error) {
                    console.error("Error querying characters:", error);
                    await replyPlainTextLineMessage(replyToken, "查詢角色時發生錯誤，請稍後再試");
                }
            }
        },
    },
    {
        // 幫助指令
        regexp: /^\/([hH](elp(er)?)?|!|幫助|(小)?幫手)$/,
        reply: async (replyToken: string) => {
            const helpMessage = `可用指令：
/c SAB - 計算裝備 C 數
/角色 角色名字 - 搜尋角色資訊
範例：/c SAA, /角色 春田未來`;
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
