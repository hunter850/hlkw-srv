import axios from "axios";

interface LineCarouselColumn {
    thumbnailImageUrl?: string;
    title: string;
    text: string;
    actions: Array<{
        type: "postback" | "message" | "uri";
        label: string;
        data?: string;
        text?: string;
        uri?: string;
    }>;
}

async function replyCarouselLineMessage(replyToken: string, altText: string, columns: LineCarouselColumn[]) {
    const url = "https://api.line.me/v2/bot/message/reply";

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };

    const body = {
        replyToken: replyToken,
        messages: [
            {
                type: "template",
                altText: altText,
                template: {
                    type: "carousel",
                    columns: columns,
                },
            },
        ],
    };

    await axios.post(url, body, { headers });
}

export default replyCarouselLineMessage;
