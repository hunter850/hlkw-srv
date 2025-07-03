#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * 動態查找 better-sqlite3 目錄並執行構建
 * Dynamically find better-sqlite3 directory and execute build
 */
function findAndBuildSqlite() {
    const pnpmDir = path.join(process.cwd(), "node_modules", ".pnpm");

    if (!fs.existsSync(pnpmDir)) {
        console.error("❌ .pnpm directory not found");
        process.exit(1);
    }

    try {
        // 查找所有 better-sqlite3 相關目錄
        const dirs = fs.readdirSync(pnpmDir);
        const sqliteDir = dirs.find((dir) => dir.startsWith("better-sqlite3@"));

        if (!sqliteDir) {
            console.error("❌ better-sqlite3 directory not found in .pnpm");
            process.exit(1);
        }

        const buildPath = path.join(pnpmDir, sqliteDir, "node_modules", "better-sqlite3");

        if (!fs.existsSync(buildPath)) {
            console.error(`❌ better-sqlite3 module not found at: ${buildPath}`);
            process.exit(1);
        }

        console.log(`🔧 Building better-sqlite3 at: ${buildPath}`);
        console.log(`📦 Found version: ${sqliteDir}`);

        // 切換到目錄並執行構建
        process.chdir(buildPath);
        execSync("pnpm build-release", { stdio: "inherit" });

        console.log("✅ better-sqlite3 build completed successfully!");
    } catch (error) {
        console.error("❌ Build failed:", error.message);
        process.exit(1);
    }
}

findAndBuildSqlite();
