# 项目文档索引

> Agent 总入口请先读根目录 **[Memory.md](../Memory.md) §0**。

## 运维与联机

| 文档 | 说明 |
|------|------|
| [pages-deploy.md](./pages-deploy.md) | Cloudflare Pages + Worker 部署、DNS、发布检查清单 |
| [../worker/README.md](../worker/README.md) | WebSocket 协议、`/room/*` 路由 |

## 游戏规则数据

| 文档 | 说明 |
|------|------|
| [game/dice-weights.md](./game/dice-weights.md) | 六面权重说明（对照用） |
| [game/dice-weights.json](./game/dice-weights.json) | 权重 JSON 快照 |
| **源码** [`src/lib/game/diceRegistry.ts`](../src/lib/game/diceRegistry.ts) | **权重与名称的权威来源** |
| [dice/骰子模板.md](./dice/骰子模板.md) | 主题色 / 图标 → `diceThemes.json` |
| **源码** [`src/lib/assets/diceThemes.json`](../src/lib/assets/diceThemes.json) | **主题数据的权威来源** |

## UI 与设计

| 文档 | 说明 |
|------|------|
| [ui-copy-catalog.md](./ui-copy-catalog.md) | 弹窗、Toast、提示文案清单 |
| [kcd2-farkle/README.md](./kcd2-farkle/README.md) | 设计系统入口 |
| [kcd2-farkle/DESIGN.md](./kcd2-farkle/DESIGN.md) | v2 视觉规范与 token |
| [kcd2-farkle/UI-REVIEW.md](./kcd2-farkle/UI-REVIEW.md) | 线框与评审清单 |
| [kcd2-farkle/ui-reference-mockup.png](./kcd2-farkle/ui-reference-mockup.png) | 外部参考效果图 |

## 目录结构

```
docs/
├── README.md              ← 本索引
├── pages-deploy.md
├── ui-copy-catalog.md
├── game/                  # 规则权重参考
│   ├── dice-weights.md
│   └── dice-weights.json
├── dice/                  # 主题骰生成说明
│   └── 骰子模板.md
└── kcd2-farkle/           # UI 设计系统
    ├── README.md
    ├── DESIGN.md
    ├── UI-REVIEW.md
    └── ui-reference-mockup.png
```

## 已移除（2026-06-04 整理）

| 原路径 | 原因 |
|--------|------|
| `docs/骰面.md` | 误用 `.md` 存 JSON → 迁至 `game/dice-weights.json` |
| `docs/骰面/*.svg` | 设计草稿，与 `public/dice/ivory` 重复 |
| `docs/下一步的demo.md` | 过期任务备忘，内容已并入 Memory / Phase F |
