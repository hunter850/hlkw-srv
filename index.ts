import app from "./src/app";
import { runMigrate } from "./src/drizzle/migrate";
import triggerAllCronJobs from "./src/cron";

const PORT = process?.env?.PORT ?? "3300";

app.set("port", PORT);

// 啟動server前嘗試執行migration
const startServer = async () => {
  // 嘗試執行資料庫遷移，但不阻止server啟動
  try {
    console.log("Starting database migration...");
    await runMigrate();
    console.log("Database migration completed!");
  } catch (error) {
    console.error(
      "Database migration failed, but server will continue to start:",
      error
    );
  }
  triggerAllCronJobs();

  // 無論migration成功或失敗都啟動server
  app.listen(PORT, () => {
    console.log(
      `Server is running on http://localhost:${PORT}`
    );
  });
};

startServer();
