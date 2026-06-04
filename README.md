# KCD2 Farkle — 骰子酒馆

《天国拯救 2》酒馆骰子小游戏 **Farkle** 的**非官方**线上双人版。

**在线游玩：** [https://farkle.yixr.uno](https://farkle.yixr.uno)  
**仓库：** [yixr-github/ytq_KCD2-Farkle](https://github.com/yixr-github/ytq_KCD2-Farkle)

> 本项目最初 fork 自 [luyu14039/KCD2-Farkle](https://github.com/luyu14039/KCD2-Farkle)，已重写联机（Cloudflare Worker）、UI 与部署，与上游 P2P 版不兼容。  
> 完整致谢、版权与使用说明见 **[NOTICE.md](NOTICE.md)**。  
> **新会话 / Agent：** 请先读 **[Memory.md](Memory.md) §0–§2**（阅读顺序、联机坑点、架构原则）。

## 项目结构

```
src/lib/game/          — 纯 TS 规则引擎（35 种骰子）
src/lib/assets/        — 骰面主题（diceThemes.json）与贴图 API（diceTextures.ts）
src/lib/protocol/      — WebSocket 消息类型
src/lib/client/        — 前端会话层（GameSocket + gameSession）
src/views/             — Lobby / Game 视图
src/components/        — UI 组件
public/dice/           — 主题骰 SVG（按 DieId 分目录）+ ivory 通用面
scripts/               — 骰面生成脚本（generate-themed-dice.mjs）
worker/                — Cloudflare Worker + Durable Object 联机后端
UnitTest/              — 单元测试
```

## 开发

```bash
yarn install

# 终端 1：联机 API
yarn worker:dev

# 终端 2：前端
yarn dev
```

打开 `http://localhost:5173`，两标签页进入同一房间即可联机测试。

## 脚本

```bash
yarn dev            # Vite 开发服务器
yarn build          # 生产构建 → dist/
yarn preview        # 预览生产构建
yarn test           # 单元测试
yarn typecheck      # TypeScript 检查
yarn check          # svelte-check + typecheck
yarn dice:generate  # 从 diceThemes.json 生成 public/dice/{DieId}/*.svg
yarn worker:dev     # 本地 Worker（8787）
yarn worker:deploy
```

修改骰子配色或图标后，编辑 [`src/lib/assets/diceThemes.json`](src/lib/assets/diceThemes.json)（说明见 [`docs/dice/骰子模板.md`](docs/dice/骰子模板.md)），再执行 `yarn dice:generate`。

## 环境变量

| 文件 | `VITE_WS_BASE` |
|------|----------------|
| `.env.development` | `ws://127.0.0.1:8787` |
| `.env.production` | `wss://farkle.yixr.uno` |

参考 [`.env.example`](.env.example)。

## 部署

- 前端：Cloudflare Pages，见 [docs/pages-deploy.md](docs/pages-deploy.md)
- 后端：Cloudflare Worker，见 [worker/README.md](worker/README.md)

对外域名：`farkle.yixr.uno`

## 文档（新会话 Agent 请先读 Memory §0）

| 文档 | 说明 |
|------|------|
| **[Memory.md](Memory.md)** | **主上下文**：架构、联机坑点、UI 现状、变更表（§0 阅读顺序） |
| [docs/README.md](docs/README.md) | **文档总索引** |
| [NOTICE.md](NOTICE.md) | 版权、上游 fork 致谢、非商业约定 |
| [worker/README.md](worker/README.md) | WebSocket 协议与 Worker 部署 |
| [docs/pages-deploy.md](docs/pages-deploy.md) | Cloudflare Pages 构建与域名 |
| [docs/ui-copy-catalog.md](docs/ui-copy-catalog.md) | 界面文案清单 |
| [docs/dice/骰子模板.md](docs/dice/骰子模板.md) | 36 种骰子主题（`yarn dice:generate`） |
| [docs/game/dice-weights.md](docs/game/dice-weights.md) | 骰子权重参考（源码见 `diceRegistry.ts`） |
| [docs/kcd2-farkle/README.md](docs/kcd2-farkle/README.md) | 设计系统 → DESIGN / UI-REVIEW |

**与上游差异：** 本仓库为 **Worker 权威联机** + 独立 UI，非 [luyu14039/KCD2-Farkle](https://github.com/luyu14039/KCD2-Farkle) 的 P2P（Trystero）版。

**近期（2026-06-04）：** 主题骰 SVG、GSAP 掷骰动画；邀请链接仅房间号；联机 UX（选骰同步、收分提醒）；根路径默认新开一桌；详见 [Memory.md §1](Memory.md)。

**线框：** [UI-REVIEW §4](docs/kcd2-farkle/UI-REVIEW.md#4-界面线框) · [DESIGN §5](docs/kcd2-farkle/DESIGN.md#5-页面线框信息架构) · [Memory §3.5](Memory.md)

## 新仓库 / 新 Cursor 会话

1. 克隆 **[ytq_KCD2-Farkle](https://github.com/yixr-github/ytq_KCD2-Farkle)**（或复制本目录到新文件夹后 `git init` 并 push）
2. Agent 先读 **[Memory.md](Memory.md) §0–§2**，再按需查 [NOTICE.md](NOTICE.md)、[docs/pages-deploy.md](docs/pages-deploy.md)
3. 本地：`yarn install` + `yarn --cwd worker install` → `yarn worker:dev` + `yarn dev`
4. 生产环境变量见 `.env.production`（勿提交密钥；`.env.*` 已在 `.gitignore`）

## 版权与致谢

- **[NOTICE.md](NOTICE.md)** — 上游 fork 致谢、KCD2 / Warhorse 免责声明、非商业使用与再分发约定
- 上游参考：[luyu14039/KCD2-Farkle](https://github.com/luyu14039/KCD2-Farkle)（P2P 版，见 [其 Pages 演示](https://luyu14039.github.io/KCD2-Farkle)）
