import { defineConfig } from "drizzle-kit";
import * as path from "path";

const dbPath = path.resolve(process.cwd(), "db/sqlite.db");

// 跨平台的 file URL 處理
const dbUrl =
  process.platform === "win32"
    ? `file:///${dbPath.replace(/\\/g, "/")}` // Windows: file:///C:/path/to/file
    : `file://${dbPath}`; // Unix (Mac/Linux): file:///path/to/file

export default defineConfig({
  schema: path.relative(process.cwd(), "src/drizzle/schema.ts"),
  out: path.relative(process.cwd(), "src/drizzle/migrations"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
  migrations: {},
});
