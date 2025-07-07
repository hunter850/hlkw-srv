import { Router } from "express";
// types
import type { Request, Response } from "express";

import updateTalents from "../services/updateTalents";

const router = Router();

router.get("/talent_list", async (_req: Request, res: Response) => {
    await updateTalents(res);
});

export default router;
