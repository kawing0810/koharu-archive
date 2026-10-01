# 小晴封存

TPE48 劉曉晴動態的本機備份，圖文都在硬碟，不連線也能瀏覽。

原平台已於 2026/9/21 停止更新、2026/10/1 關閉。這份專案只供個人回看。

## 兩種用法

| | GitHub Pages | 本機（方案 C） |
|--|--|--|
| 文字／圖片 | 有 | 有 |
| 影片 | 無（體積太大，無法進 GitHub） | 有 |
| 補檔匯入 | 不可 | 可（`npm run dev`） |
| 遠端連線 | 公開網址 | Tailscale 或 Cloudflare Tunnel |

### 本機完整版（含影片）

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

### GitHub Pages（文字＋圖片）

推送到 `main` 後由 Actions 部署。網址約為：

`https://<你的帳號>.github.io/koharu-archive/`

影片在 Pages 上會顯示「僅本機可播」。`.mp4` 已列入 `.gitignore`，不會上傳。

本機靜態預覽（同樣不含 API）：

```bash
npm run build:pages
npx serve out
```

## 遠端看完整封存（方案 C）

電腦要開著、封存資料夾在本機，再用下面其中一種把 `localhost:3000` 暴露給自己：

### Tailscale（建議，只給自己的裝置）

1. 本機與手機都安裝並登入 [Tailscale](https://tailscale.com/)
2. 本機執行 `npm run dev`
3. 用 Tailscale 給這台電腦的 IP，在其他裝置開 `http://100.x.x.x:3000`

### Cloudflare Tunnel（臨時公開網址）

1. 安裝 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
2. 本機執行 `npm run dev`
3. 另開終端機：`cloudflared tunnel --url http://localhost:3000`
4. 用它印出的 `https://….trycloudflare.com` 連線（連結會變，關掉即失效）

不要把 Tunnel 網址隨意公開；內容是個人封存。

## 頁面

- `/` 動態牆
- `/post/:id` 貼文內頁
- `/import` 補限定圖／影片（僅本機）
- `/member` 關於封存

其餘分頁（聊天、商店等）僅保留入口，內容未備份。

## 補限定媒體

左側「匯入貼文」可為缺檔的限定貼補圖或影片。檔案會寫進 `public/media/limited`。請在本機 `npm run dev` 操作。
