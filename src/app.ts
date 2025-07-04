import express from "express";
import cors from "cors";
import * as path from "path";
import dotenv from "dotenv";
// routes
import indexRoute from "./routes/index";
import cronRoute from "./routes/cron";
// types
import type { Request, Response } from "express";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// 建立 Express 應用
const app = express();

// 模板引擎設定
app.set("views", path.resolve(process.cwd(), "src/views"));
app.set("view engine", "ejs");

// 中間件設定
const origin = process.env
  .WHITE_LIST_ORIGIN!.split(",")
  .map((item) => item.trim());
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve(process.cwd(), "public")));

// 路由設定 首頁
app.get("/", (req: Request, res: Response) => {
  res.render("index", { title: "Express", message: "Welcome to Express" }); // 設定 ejs 全域變數 locals 的值
});

// index
app.use("/api", indexRoute);
app.use("/api/cron", cronRoute);

// 404 錯誤處理
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  } else {
    res.status(404).render("index", {
      title: "404 Not Found",
      message: "找不到您請求的頁面",
    });
  }
});

export default app;
