# Cloudflare 部署说明

> 仓库：[yixr-github/ytq_KCD2-Farkle](https://github.com/yixr-github/ytq_KCD2-Farkle)  
> 生产域名：**https://farkle.yixr.uno**

前端（Pages）与联机 API（Worker）**同域不同职责**：

| 流量 | 负责方 |
|------|--------|
| `https://farkle.yixr.uno/`、`/room/*` 页面（HTTP GET） | **Pages** `kcd2-farkle` |
| `wss://farkle.yixr.uno/room/{id}` | **Worker** `ytq-kcd2-farkle-api`（路由 `farkle.yixr.uno/room/*`） |
| `https://farkle.yixr.uno/health` | Worker JSON 健康检查 |

---

## 1. 前端（Cloudflare Pages）

### Build 设置

| 项 | 值 |
|---|---|
| Build command | `yarn build` |
| Build output | `dist` |
| Node version | 20+ |
| 环境变量 `VITE_WS_BASE` | `wss://farkle.yixr.uno` |

### 一次性上传（当前用法）

```bash
yarn install
yarn build
npx wrangler pages deploy dist --project-name=kcd2-farkle --branch=main --commit-dirty=true
```

预览域：`https://kcd2-farkle.pages.dev`（每次部署会另有 `https://<hash>.kcd2-farkle.pages.dev`）。

### GitHub Actions（可选）

在 Pages 项目设置中选 **GitHub Actions** 作为 Source，或使用 workflow 构建 `dist` 并 `actions/deploy-pages`。环境变量同上。

### SPA 路由

`public/_redirects` 已配置：`/room/*` 与 `/*` → `index.html`（200）。

---

## 2. 后端（Cloudflare Worker）

```bash
yarn install
yarn worker:deploy
# 或 cd worker && yarn deploy
```

Worker 名称：`ytq-kcd2-farkle-api`（见 `worker/wrangler.toml`）。

### 路由与 DNS（重要）

1. **DNS**：`farkle` → **CNAME** `kcd2-farkle.pages.dev`（橙云代理）
2. **Worker**：只添加**路由** `farkle.yixr.uno/room/*`，**不要**把整条 `farkle.yixr.uno` 绑为 Worker 自定义域（会与 Pages 抢 DNS）
3. Pages 自定义域：`farkle.yixr.uno`

若浏览器打开 `https://farkle.yixr.uno/room/XXX` 只看到 API 纯文本，说明 DNS/路由未按上表配置。Worker 已对非 WebSocket 的 GET 做 **Pages 代理**（`PAGES_HOST=kcd2-farkle.pages.dev`，见 `worker/wrangler.toml`）。

---

## 3. 发布检查清单

- [ ] `yarn test` 通过
- [ ] `yarn build` 成功，产物含 `VITE_WS_BASE=wss://farkle.yixr.uno`
- [ ] `yarn worker:deploy` 成功
- [ ] 双标签进同一房间可联机；邀请链接为 `/room/{id}` **无** `?name=房主昵称`
- [ ] `https://farkle.yixr.uno/room/TEST` 显示游戏页而非纯文本

---

## 4. 本地预览生产构建

```bash
yarn build
yarn preview
```

注意：预览页仍会连 `.env.production` 里的 `wss://farkle.yixr.uno`，需 Worker 已部署。
