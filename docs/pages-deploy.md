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

## 1. 日常发布（推荐：Git 自动部署）

**Pages** 与 **Worker** 均在 Cloudflare 控制台连接本仓库 GitHub；向 `main` **push** 后两边各自触发构建，无需本地 `wrangler pages deploy`。

| 项目 | 控制台路径 | 构建 |
|------|------------|------|
| 前端 | Workers & Pages → `kcd2-farkle` | `yarn build` → 输出 `dist/` |
| 后端 | Workers → `ytq-kcd2-farkle-api` | `worker/` 目录（见 `wrangler.toml`） |

**发布流程：**

1. 本地 `yarn test`（及必要时 `yarn run check`）
2. `git push origin main`
3. 在 Cloudflare 控制台确认 **Pages** 与 **Worker** 部署均为 Success
4. 打开 `https://farkle.yixr.uno` 验收（双标签联机、邀请链接 `/room/{id}` 无 `?name=`）

**本地开发注意：** 改 `worker/` 后须**重启** `yarn worker:dev`；改前端由 Vite HMR 热更新。仅 push 后生产环境才更新。

---

## 2. 前端（Cloudflare Pages）

### Build 设置

| 项 | 值 |
|---|---|
| Build command | `yarn build` |
| Build output | `dist` |
| Node version | 20+ |
| 环境变量 `VITE_WS_BASE` | `wss://farkle.yixr.uno` |

预览域：`https://kcd2-farkle.pages.dev`（每次部署会另有 `https://<hash>.kcd2-farkle.pages.dev`）。

### 手动上传（备选）

Git 集成异常或需紧急热修时：

```bash
yarn install
yarn build
npx wrangler pages deploy dist --project-name=kcd2-farkle --branch=main --commit-dirty=true
```

### SPA 路由

`public/_redirects` 已配置：`/room/*` 与 `/*` → `index.html`（200）。

---

## 3. 后端（Cloudflare Worker）

日常由 Git 集成自动部署。手动备选：

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

## 4. 发布检查清单

- [ ] `yarn test` 通过
- [ ] `git push` 后 Pages **与** Worker 控制台均显示部署成功
- [ ] 生产构建含 `VITE_WS_BASE=wss://farkle.yixr.uno`（Pages 环境变量）
- [ ] 双标签进同一房间可联机；邀请链接为 `/room/{id}` **无** `?name=房主昵称`
- [ ] `https://farkle.yixr.uno/room/TEST` 显示游戏页而非纯文本
- [ ] 切后台 2 分钟内回前台可重连续局（Worker 改动须已部署）

---

## 5. 本地预览生产构建

```bash
yarn build
yarn preview
```

注意：预览页仍会连 `.env.production` 里的 `wss://farkle.yixr.uno`，需 Worker 已部署。
