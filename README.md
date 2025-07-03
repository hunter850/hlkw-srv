# First Render

## 疑難排解 / Troubleshooting

### better-sqlite3 問題 / better-sqlite3 Issues

如果遇到 better-sqlite3 相關問題，請執行以下命令：

If you encounter issues with better-sqlite3, run the following command:

```bash
pnpm run build:sqlite
```

這個命令會自動查找並重新編譯 better-sqlite3 模組，不論版本為何，通常可以解決安裝或運行時的問題。

This command will automatically find and recompile the better-sqlite3 module regardless of version, which typically resolves installation or runtime issues.

### pnpm db:studio 錯誤 / pnpm db:studio Error

如果使用 `pnpm db:studio` 遇到 `net::ERR_QUIC_PROTOCOL_ERROR 200` 錯誤，這是因為 Chrome 的特殊協議可以加速部分網站，但導致 studio 無法使用。

If you encounter `net::ERR_QUIC_PROTOCOL_ERROR 200` error when using `pnpm db:studio`, this is due to Chrome's special protocol that can accelerate some websites but causes studio to malfunction.

**解決辦法 / Solution:**

1. 在 Chrome 網址列輸入：`chrome://flags`
2. 搜尋並找到 "Experimental QUIC protocol"
3. 將設定改為 "Disabled"
4. 重新啟動 Chrome

**Steps:**

1. Enter in Chrome address bar: `chrome://flags`
2. Search for "Experimental QUIC protocol"
3. Set it to "Disabled"
4. Restart Chrome
