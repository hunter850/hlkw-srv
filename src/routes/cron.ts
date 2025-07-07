import { Router } from "express";
import updateTalents from "../services/updateTalents";
// types
import type { Request, Response } from "express";

const router = Router();

router.get("/talent_list", async (_req: Request, res: Response) => {
    await updateTalents(res);
});

export default router;
