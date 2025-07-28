import chalk from "chalk";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import logger from "morgan";
import * as path from "path";

import cronRoute from "./routes/cron";
import holoRoute from "./routes/holo";
import indexRoute from "./routes/index";
import ytRoute from "./routes/yt";
import type { RequestWithRawBuffer } from "./types";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// 建立 Express 應用
const app = express();

// 模板引擎設定
app.set("views", path.resolve(process.cwd(), "src/views"));
app.set("view engine", "ejs");

// 中間件設定
const origin = process.env.WHITE_LIST_ORIGIN!.split(",").map((item) => item.trim());
app.use(logger("dev"));
app.use(
    express.json({
        verify: (req: RequestWithRawBuffer, _res, buff) => {
            req.rawBuffer = buff;
        },
    })
);
app.use(
    cors({
        credentials: true,
        origin,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve(process.cwd(), "public")));

app.use((req, res, next) => {
    console.log(chalk.hex("#FFA500").bold("method: ", req.method));
    console.log(chalk.green("route: ", req.originalUrl));
    next();
});

// 路由設定 首頁
app.get("/", (req: Request, res: Response) => {
    res.render("index", { title: "Express", message: "Welcome to Express" }); // 設定 ejs 全域變數 locals 的值
});

// index
app.use("/api", indexRoute);
app.use("/api/holo", holoRoute);
app.use("/api/cron", cronRoute);
app.use("/api/yt", ytRoute);

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
