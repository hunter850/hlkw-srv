import dotenv from "dotenv";
import { like, or } from "drizzle-orm";
import { Router } from "express";
import path from "path";

import { db } from "../drizzle/dbs/bd2Db";
import { CharacterTable } from "../drizzle/schemas/bd2/character";
import { CostumeTable } from "../drizzle/schemas/bd2/costume";
import lineSignatureValidater from "../modules/lineSignatureValidater";
import requestErrorHandler from "../modules/requestErrorHandler";
import type { RequestWithRawBuffer } from "../types";
import calculateBD2EquipLevel from "../utils/calculateBD2EquipLevel";
import replyFlexLineMessage from "../utils/replyFlexLineMessage";
import replyPlainTextLineMessage from "../utils/replyPlainTextLineMessage";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getPropertyColor(property: typeof CharacterTable.$inferSelect.property) {
    switch (property) {
        case "fire":
            return "#ff0000";
        case "water":
            return "#0000ff";
        case "wind":
            return "#00ff00";
        case "light":
            return "#ff00ff";
        case "dark":
            return "#000000";
        default:
            return "#666666";
    }
}

const router = Router();
export interface LineMessageEvent {
    type: string;
    message: {
        type: string;
        id: string;
        quoteToken: string;
        text: string; // 使用者傳入的文字
    };
    webhookEventId: string;
    deliveryContext: {
        isRedelivery: boolean;
    };
    timestamp: number;
    source: {
        type: string;
        userId: string; // 使用者 ID
        groupId?: string; // 群組 ID
    };
    replyToken: string; // 回覆訊息時要帶在 header 中的 token
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
                    const characters = await db.query.CharacterTable.findMany({
                        with: {
                            costumes: true,
                            knockBackDirection: true,
                        },
                        where: or(
                            like(CharacterTable.name, `%${characterName}%`),
                            like(CharacterTable.enName, `%${characterName}%`)
                        ),
                    });
                    console.log("characters: ", JSON.stringify(characters, null, 2));
                    if (characters.length === 0) {
                        await replyPlainTextLineMessage(replyToken, `找不到匹配的角色：${characterName}`);
                        return;
                    }

                    // 構建 bubble
                    const bubbles = characters.map((char) => {
                        return {
                            type: "bubble" as const,
                            hero: char.avatar
                                ? {
                                      type: "image" as const,
                                      url: char.avatar,
                                      size: "full",
                                      aspectRatio: "3:4", // 設定為 3:4 aspect ratio
                                      aspectMode: "cover",
                                  }
                                : undefined,
                            body: {
                                type: "box" as const,
                                layout: "vertical",
                                contents: [
                                    {
                                        type: "text" as const,
                                        text: char.name,
                                        weight: "bold",
                                        size: "md",
                                        wrap: true,
                                    },
                                    {
                                        type: "text" as const,
                                        text: `${char.enName}\n${char?.atk ? `攻擊力：${char?.atk ?? "?"}` : `魔法力：${char?.matk ?? "?"}`}\n生命力：${char?.hp ?? "?"}\n防禦力：${char?.def ? `${char.def * 100}%` : "?"}\n魔法抵抗：${typeof char?.mres === "number" && !Number.isNaN(char.mres) ? `${char.mres * 100}%` : "?"}\n暴擊率：${char?.critRate ? `${char.critRate * 100}%` : "?"}\n暴擊傷害：${char?.critDmg ? `${char.critDmg * 100}%` : "?"}`,
                                        size: "sm",
                                        color: "#666666",
                                        wrap: true,
                                        margin: "md",
                                    },
                                    ...(char.costumes.length > 0
                                        ? [
                                              {
                                                  type: "separator" as const,
                                                  margin: "md",
                                              },
                                          ]
                                        : []),
                                ],
                            },
                            footer:
                                char.costumes.length > 0
                                    ? {
                                          type: "box" as const,
                                          layout: "vertical",
                                          spacing: "sm",
                                          contents: char.costumes.map((costume) => ({
                                              type: "button" as const,
                                              style: "link",
                                              height: "sm",
                                              action: {
                                                  type: "message" as const,
                                                  label: costume.costumeName,
                                                  text: `/服裝 ${costume.costumeName}`,
                                              },
                                          })),
                                      }
                                    : undefined,
                        };
                    });

                    // 判斷是使用單個 bubble 還是 carousel
                    const flexContents =
                        characters.length === 1
                            ? bubbles[0]
                            : {
                                  type: "carousel" as const,
                                  contents: bubbles,
                              };

                    await replyFlexLineMessage(replyToken, `找到 ${characters.length} 個匹配的角色`, flexContents);
                } catch (error) {
                    console.error("Error querying characters:", error);
                    await replyPlainTextLineMessage(replyToken, "查詢角色時發生錯誤，請稍後再試");
                }
            }
        },
    },
    {
        regexp: /^\/(?:服裝|costume)\s+(.+)$/i,
        reply: async (replyToken: string, userMessage: string) => {
            const match = userMessage.match(/^\/(?:服裝|costume)\s+(.+)$/i);
            if (match) {
                const searchTerm = match[1].trim();
                try {
                    // 先嘗試按服裝名稱搜尋
                    let costumes = await db.query.CostumeTable.findMany({
                        where: like(CostumeTable.costumeName, `%${searchTerm}%`),
                        with: {
                            character: {
                                with: {
                                    knockBackDirection: true,
                                },
                            },
                        },
                    });
                    console.log("costumes: ", JSON.stringify(costumes, null, 2));
                    let isCharacterSearch = false;

                    if (costumes.length === 0) {
                        // 如果沒找到服裝，按角色名稱搜尋
                        const characters = await db.query.CharacterTable.findMany({
                            with: {
                                costumes: true,
                                knockBackDirection: true,
                            },
                            where: or(
                                like(CharacterTable.name, `%${searchTerm}%`),
                                like(CharacterTable.enName, `%${searchTerm}%`)
                            ),
                        });

                        if (characters.length > 0) {
                            // 如果找到角色，收集該角色的所有服裝
                            isCharacterSearch = true;
                            costumes = characters.flatMap((char) =>
                                char.costumes.map((costume) => ({
                                    ...costume,
                                    character: char,
                                }))
                            );
                        }
                    }

                    if (costumes.length === 0) {
                        await replyPlainTextLineMessage(
                            replyToken,
                            `找不到匹配的${isCharacterSearch ? "角色或" : ""}服裝：${searchTerm}`
                        );
                        return;
                    }

                    // 構建 bubble
                    const bubbles = costumes.map((costume) => {
                        console.log(
                            "knockBackDirection: ",
                            JSON.stringify(costume.character.knockBackDirection, null, 2)
                        );
                        return {
                            type: "bubble" as const,
                            hero: {
                                type: "image",
                                url: costume.costumeAvatar,
                                size: "full",
                                aspectRatio: "3:4",
                                aspectMode: "cover",
                            },
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    {
                                        type: "text",
                                        text: `${costume.character.name} - ${costume.costumeName}`,
                                        weight: "bold",
                                        size: "md",
                                        wrap: true,
                                    },
                                    {
                                        type: "text",
                                        text: `${costume.character.enName}\n${costume?.character?.atk ? `攻擊力：${costume?.character?.atk ?? "?"}` : `魔法力：${costume?.character?.matk ?? "?"}`}\n生命力：${costume?.character?.hp ?? "?"}\n防禦力：${costume?.character?.def ? `${costume.character.def * 100}%` : "?"}\n魔法抵抗：${typeof costume?.character?.mres === "number" && !Number.isNaN(costume.character.mres) ? `${costume.character.mres * 100}%` : "?"}\n暴擊率：${costume?.character?.critRate ? `${costume.character.critRate * 100}%` : "?"}\n暴擊傷害：${costume?.character?.critDmg ? `${costume.character.critDmg * 100}%` : "?"}\nSP：${costume.sp}\nCD：${costume.cd}\n連擊數：${costume.chain}\n攻擊方式：`,
                                        size: "sm",
                                        color: "#666666",
                                        wrap: true,
                                        margin: "md",
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        margin: "md",
                                        contents: [
                                            {
                                                type: "image",
                                                url: costume.skillRange,
                                                size: "xxs",
                                                aspectMode: "cover",
                                            },
                                            {
                                                type: "text",
                                                text: costume.character.attackWay === "front" ? "最前方" : "跳過",
                                                size: "sm",
                                                color: getPropertyColor(costume.character.property),
                                                wrap: true,
                                            },
                                            {
                                                type: "image",
                                                url: costume.character.knockBackDirection.image,
                                                size: "xxs",
                                                aspectMode: "cover",
                                            },
                                        ],
                                    },
                                ],
                            },
                        };
                    });

                    // 判斷是使用單個 bubble 還是 carousel
                    const flexContents =
                        costumes.length === 1
                            ? bubbles[0]
                            : {
                                  type: "carousel" as const,
                                  contents: bubbles,
                              };

                    const resultMessage = isCharacterSearch
                        ? `按角色搜尋：找到 ${costumes.length} 個服裝`
                        : `找到 ${costumes.length} 個匹配的服裝`;

                    await replyFlexLineMessage(replyToken, resultMessage, flexContents);
                } catch (error) {
                    console.error("Error querying costumes:", error);
                    await replyPlainTextLineMessage(replyToken, "查詢服裝時發生錯誤，請稍後再試");
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
範例：/c SAA

/角色 角色名字 - 搜尋角色資訊
範例：/角色 拉德爾

/服裝 角色名字或服裝名字 - 搜尋服裝（可按角色或服裝名稱搜尋）
範例：/服裝 草藥獵人
範例：/服裝 拉德爾`;
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
