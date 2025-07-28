import crypto from "crypto";
import { NextFunction, Response } from "express";

import type { RequestWithRawBuffer } from "../types";

function lineSignatureValidater(req: RequestWithRawBuffer, res: Response, next: NextFunction) {
    const signature = req.headers["x-line-signature"];
    const buff = req.rawBuffer;
    if (!buff) {
        res.status(403).send("Invalid signature: no buffer");
        return;
    }
    const hash = crypto.createHmac("SHA256", process.env.LINE_CHANNEL_SECRET!).update(buff).digest("base64");

    if (signature !== hash) {
        res.status(403).send("Invalid signature: signature not match");
        return;
    }

    next();
}

export default lineSignatureValidater;
