import axios from "axios";

interface FlexCarouselContents {
    type: "carousel";
    contents: any[];
}

interface FlexBubbleContents {
    type: "bubble";
    hero?: any;
    body?: any;
    footer?: any;
}

type FlexContents = FlexCarouselContents | FlexBubbleContents;

async function replyFlexLineMessage(replyToken: string, altText: string, flexContents: FlexContents) {
    const url = "https://api.line.me/v2/bot/message/reply";

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };

    const body = {
        replyToken: replyToken,
        messages: [
            {
                type: "flex",
                altText: altText,
                contents: flexContents,
            },
        ],
    };

    await axios.post(url, body, { headers });
}

export default replyFlexLineMessage;
