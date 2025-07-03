import { Router } from "express";
// types
import type { Request, Response } from "express";
import { db } from "../drizzle/db";
import { UserTable } from "../drizzle/schema";
import type { RequestBody } from "../types";

const router = Router();

router.get("/now", (_req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    res.status(200).json({ success: true, data: now });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: error?.message ?? "Unknown Error" });
  }
});

router.get("/user", async (_req: Request, res: Response) => {
  try {
    const users = await db.select().from(UserTable);
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: error?.message ?? "Unknown Error" });
  }
});

router.post(
  "/user",
  async (req: RequestBody<typeof UserTable.$inferInsert>, res: Response) => {
    try {
      if (
        !req.body.name ||
        !req.body.age ||
        !req.body.email ||
        typeof req.body.age !== "number" ||
        typeof req.body.email !== "string" ||
        typeof req.body.name !== "string"
      ) {
        res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
        return;
      }
      const insertData: typeof UserTable.$inferInsert = {
        name: req.body.name,
        age: req.body.age,
        email: req.body.email,
      };
      const user = await db.insert(UserTable).values(insertData).returning();
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error?.message ?? "Unknown Error" });
    }
  }
);

export default router;
