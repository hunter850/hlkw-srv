import axios from "axios";

async function replyPlainTextLineMessage(replyToken: string, message: string) {
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

export default replyPlainTextLineMessage;
