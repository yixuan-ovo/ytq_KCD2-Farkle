# Farkle API — Cloudflare Worker + Durable Object

> 项目总览与 Agent 阅读顺序见根目录 **[Memory.md](../Memory.md) §0**、**[docs/pages-deploy.md](../docs/pages-deploy.md)**。

每个房间对应一个 Durable Object 实例，WebSocket 实时同步 `GameState`。

## 本地开发

```bash
cd worker
yarn install
yarn dev
```

默认地址：`ws://127.0.0.1:8787/room/TEST`

## 消息协议

**连接**

```
wss://farkle.yixr.uno/room/{ROOM_ID}
```

**客户端 → 服务器**

```json
{ "type": "join", "name": "亨利" }
{ "type": "start" }
{ "type": "roll" }
{ "type": "keep", "dieIds": [0, 2] }
{ "type": "bank" }
```

**服务器 → 客户端**

```json
{ "type": "state", "state": { ...GameState }, "you": "host" }
{ "type": "error", "message": "还没轮到你" }
```

## 浏览器快速测试

打开两个标签页，控制台粘贴：

```javascript
const ws = new WebSocket('ws://127.0.0.1:8787/room/DEMO');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.onopen = () => ws.send(JSON.stringify({ type: 'join', name: '玩家1' }));
// 第二个标签 name 改为 玩家2，然后房主执行：
ws.send(JSON.stringify({ type: 'start' }));
ws.send(JSON.stringify({ type: 'roll' }));
```

## 部署到 Cloudflare

**日常：** 控制台已将本仓库 Worker（`ytq-kcd2-farkle-api`）连 GitHub，`main` push 后自动部署。本地改代码须重启 `yarn worker:dev`。

**手动备选：**

1. 登录：`npx wrangler login`
2. 部署：`yarn deploy`

> **Workers 免费计划**须使用 SQLite 版 Durable Object（`wrangler.toml` 里为 `new_sqlite_classes`，已配置）。

3. Cloudflare 控制台 → Workers → `ytq-kcd2-farkle-api` → 设置 → 域和路由  
   添加：`farkle.yixr.uno`（路径 `/room/*` 或按控制台向导配置）
4. DNS 会自动出现 Worker 类型记录（与现有 `relay.yixr.uno` 相同）

> **同一域名方案：** DNS 的 `farkle` 指向 **Pages**（CNAME → `kcd2-farkle.pages.dev`）；Worker 仅加**路由** `farkle.yixr.uno/room/*`（不要绑整条自定义域）。浏览器打开 `https://farkle.yixr.uno/room/XXX` 须进前端；Worker 对非 WebSocket 的 `/room/*` 会代理到 `PAGES_HOST`（见 `wrangler.toml`）。

## 目录说明

| 文件 | 作用 |
|------|------|
| `src/index.ts` | Worker 入口，`/room/{id}` 路由到 DO |
| `src/game-room.ts` | Durable Object：WebSocket + 广播 |
| `src/session.ts` | 回合逻辑，调用 `src/lib/game/*` |
| `../src/lib/protocol/messages.ts` | 前后端共享消息类型 |
