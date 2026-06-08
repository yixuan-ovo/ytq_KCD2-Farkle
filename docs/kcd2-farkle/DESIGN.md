# KCD2 Farkle — 酒馆骰子设计系统

> **基础模板：** [`design-md/starbucks/DESIGN.md`](../starbucks/DESIGN.md)  
> **项目：** 《天国拯救2》Farkle 线上双人版  
> **版本：** v2（2026-06，深色沉浸为正式方向，CSS 已落地 `src/app.css`）

---

## v2 变更摘要（相对 v0.1 亮羊皮纸）

| 项 | v0.1 | v2（当前） |
|----|------|------------|
| 主画布 | `#f2ebe0` 亮羊皮纸 | `#1a120b` 深木 + 烛光聚光 |
| 对局舞台 | 浅色骰盘卡片 | `DiceTable` 径向木桌 `#2d1e13` → `#4d3522` |
| 主 CTA | 酒红 pill | 烫金描边 `.btn-gilded` |
| 计分 | gold 仅数字 | gold 数字 + 羊皮纸 `panel-parchment` |
| 选中骰子 | wine 描边 | 上浮 12px + 金/蓝光晕 |
| 字体 | 系统衬线 | Noto Sans SC + ZCOOL KuaiLe + Cinzel Decorative + JetBrains Mono（Google Fonts） |

参考效果图：[`ui-reference-mockup.png`](./ui-reference-mockup.png)（原外部设计稿，已归档至本目录）。

**实现状态（2026-06）：** v2 深色 UI、**36 套主题骰 SVG**、GSAP 四段掷骰动画已落地；下文 v0.1 部分描述仍作历史对照，以 **v2 摘要 + `src/app.css` + Memory §1.7** 为准。

---

## v2 补充 — 骰子贴图与掷骰动画

### 主题骰 SVG（`public/dice/{DieId}/`）

| 文件 | 用途 |
|------|------|
| `face-hidden.svg` | 首掷前占位：仅显示主题 icon（牙齿、皇冠、数字 3 等） |
| `face-1.svg` … `face-6.svg` | 标准点数面（主题 `fill` / `border` / `pip`） |
| `face-devil.svg` | 百搭（`DieFace = 0`）；`DevilDie` 的 1 点亦为恶魔图 |

- **主题数据：** [`docs/dice/骰子模板.md`](../dice/骰子模板.md) → [`src/lib/assets/diceThemes.json`](../../src/lib/assets/diceThemes.json)
- **生成：** `yarn dice:generate`（[`scripts/generate-themed-dice.mjs`](../../scripts/generate-themed-dice.mjs) + [`scripts/diceSvgCore.mjs`](../../scripts/diceSvgCore.mjs)）
- **加载 API：** [`src/lib/assets/diceTextures.ts`](../../src/lib/assets/diceTextures.ts) — `getThemedFaceUrl` / `getPlaceholderFaceUrl` / `getDieFaceUrl`（按 `die.type`）
- **图鉴：** 仍用 [`public/dice/ivory/`](../../public/dice/ivory/) 通用六面（`DiceCard`）；**大厅背景** `TavernAmbience` 用六枚特殊骰 `face-hidden.svg`

### 掷骰飞散动画（GSAP + DOM）

| 模块 | 说明 |
|------|------|
| `src/lib/ui/playDiceRollAnimation.ts` | 收拢 → 飞散 → 回槽（约 850ms）；DOM 克隆 overlay |
| `src/components/game/DiceBoard.svelte` | `physicsRolling` 时测量槽位并驱动动画 |
| `src/lib/settings/gameSettings.ts` | `physicsEnabled`（文案「掷骰飞散动画」）；`prefers-reduced-motion` 强制关闭 |

- 触发：`GameView` 在**己方回合**且 `prevRollCount >= 0 && rollCount` 递增时设 `physicsRolling`（Worker 无 `rolling` phase；`prevRollCount` 初值 `-1`，避免进局/重连误触发）
- 首掷占位：`rollCount===0 && turnScore===0` → `DicePiece` 显示 `face-hidden`；进 `selecting` 须见 6 枚背面，勿长期 `physicsRolling` 隐藏 DOM
- 动画期间：`DiceBoard` 隐藏活动区 `shortName`（克隆 overlay 飞散时字不留在槽位）
- 降级：设置关闭 / 减少动态效果 → CSS `medievalRoll`（`DicePiece`）
- **已移除：** Pixi 8 + Matter.js、`DicePhysicsStage`、`createDicePhysics.ts`（2026-06-04 起由 GSAP 方案替代）

### 组件树（当前实现）

```text
GameView
├─ GameHud（左你/右对手 + `public/avatars/`）/ TurnScoreCard（双卡）
├─ TavernQuoteBar
├─ DiceTable
│  └─ DiceBoard → DicePiece（DOM 主题贴图 + 可选 GSAP overlay）
├─ ActionBar / PhaseOverlay / FloatingScore / ComboBanner
LobbyView → MainMenu / JoinForm / RulesSheet / SettingsPanel / DiceCollectionPanel
```

---

## 0. 设计目标

### 要达成的感受

- **1403 年波西米亚酒馆**：木桌、烛光、麦酒、骰子碰撞声（视觉暗示即可，首版可不配音频）
- **可读性优先**：联机对战信息（分数、回合、骰面）必须一眼看清
- **暖而不脏**：像 Starbucks 模板那样用 cream 画布 + 深色书挡，但绿咖啡品牌色全部替换为**酒红 / 深木**
- **金币仪式感**：金色只用于得分、收分、胜利——与 Starbucks Gold 用法一致

### 明确不要

- 现代 SaaS 白底 + 霓虹渐变（Framer / Linear 风）
- 金融科技紫 / 绿（Revolut / Wise 风）
- 过度写实的脏污纹理影响 UI 对比度
- 全屏暗色为主（Raycast 风）——暗色仅用于顶栏、底栏、结算带

### 与 Starbucks 模板的映射关系

| Starbucks 角色 | KCD2 Farkle 角色 | 说明 |
|----------------|------------------|------|
| Neutral Warm `#f2f0eb` | Parchment `#f2ebe0` | 主画布，羊皮纸 |
| Ceramic `#edebe9` | Clay `#e8dfd4` | 分区背景 |
| White `#ffffff` | Linen `#faf6f0` | 卡片、骰盘 |
| House Green `#1E3932` | Dark Wood `#2c1810` | 顶栏、底栏、结算带 |
| Green Accent `#00754A` | Wine `#7a2e2e` | 主 CTA（掷骰、开始） |
| Starbucks Green `#006241` | Burgundy `#5c2222` | 标题强调 |
| Gold `#cba258` | Coin Gold `#c9a227` | **仅**得分 / 胜利 |
| Rewards Serif | Tavern Serif | 大标题、胜利文案 |
| Full-pill button | 保留 | 主操作按钮 |
| 12px card radius | 保留，骰子用 8px | 卡片略方一点像木牌 |

---

## 1. 视觉主题与氛围

整体节奏沿用 Starbucks 的 **「暖色主体 + 深色书挡」**：

```text
深木顶栏 → 羊皮纸主区（对局） → 深木底栏（操作）
                ↓ 阶段切换
         深木全屏带 + 金色标题（胜利 / 爆点 / Hot Dice）
```

**关键特征（继承并改造）：**

- 四层「品牌色」改为 **酒红 / 勃艮第 / 深木 / 浅酒 tint**，各有固定表面职责
- **Coin Gold 仅用于计分仪式**：`turnScore` 高亮、收分按钮边框、胜利标题、大顺子反馈
- 暖中性画布，不用冷白 `#ffffff` 大面积铺底
- 标题用 **Tavern Serif**，正文用 **Tavern Sans**
- 按钮 universal pill（`border-radius: 9999px`），按下 `scale(0.95)`
- 卡片轻阴影，不抢戏
- 间距用 rem 刻度，基准 `--space-3 = 1rem`（16px）

### 可选氛围层（Phase 2+）

- 背景：低对比度酒馆插画或 CSS 噪点 + 暗角 vignette
- 骰子：骨色 / 象牙色立方体，恶魔面 `#4a2020` + 金色符号
- 粒子：收分 / 顺子时金色微粒（参考旧版 ParticleEffect 思路，配色服从本规范）

---

## 2. 色彩系统

### 2.1 CSS 变量（实现时写入 `src/app.css`）

```css
:root {
  /* ── 品牌 / 酒馆 ── */
  --color-wine:        #7a2e2e;   /* 主 CTA、强调链接 */
  --color-wine-deep:   #5c2222;   /* H1、重要标题 */
  --color-wood:        #2c1810;   /* 顶栏、底栏、深色带 */
  --color-wood-mid:    #4a3028;   /* 次要深表面 */
  --color-wine-tint:   #e8d4d4;   /* 表单 valid、轻强调底 */

  /* ── 金币（严格限制使用场景）── */
  --color-gold:        #c9a227;
  --color-gold-light:  #dfc49d;
  --color-gold-wash:   #faf3e0;

  /* ── 表面 ── */
  --color-canvas:      #f2ebe0;   /* 页面背景 */
  --color-canvas-alt:  #e8dfd4;   /* 分区 */
  --color-surface:     #faf6f0;   /* 卡片、骰盘 */
  --color-surface-elevated: #ffffff;

  /* ── 文字 ── */
  --color-text:        rgba(44, 24, 16, 0.92);
  --color-text-soft:   rgba(44, 24, 16, 0.58);
  --color-text-on-dark: #ffffff;
  --color-text-on-dark-soft: rgba(255, 255, 255, 0.72);
  --color-text-muted-board: #5c4a42; /* 计分板次要 */

  /* ── 语义 ── */
  --color-danger:      #b91c1c;   /* 爆点、错误 */
  --color-danger-tint: hsl(4 82% 43% / 8%);
  --color-success:     #2d6a4f;   /* 连接成功、可选 */
  --color-warning:     #b45309;

  /* ── 骰子 UI ── */
  --color-die-face:    #f5f0e6;
  --color-die-kept:    var(--color-gold-wash);
  --color-die-kept-border: var(--color-gold);
  --color-die-devil:   #3d2020;
  --color-die-disabled: #d4ccc4;

  /* ── 阴影 ── */
  --shadow-card: 0 2px 8px rgba(44, 24, 16, 0.08), 0 0 2px rgba(44, 24, 16, 0.06);
  --shadow-fab:  0 0 6px rgba(44, 24, 16, 0.24), 0 8px 12px rgba(44, 24, 16, 0.14);
  --shadow-inset-tray: inset 0 2px 6px rgba(44, 24, 16, 0.12);

  /* ── 圆角 ── */
  --radius-card: 12px;
  --radius-die:  8px;
  --radius-pill: 9999px;

  /* ── 间距（Starbucks rem 刻度简化）── */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --space-6: 2.5rem;
  --space-8: 4rem;

  /* ── 动效 ── */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --button-active-scale: 0.95;
}
```

### 2.2 颜色使用规则（必须遵守）

| 颜色 | 允许 | 禁止 |
|------|------|------|
| `--color-gold` | 当前回合分、收分、胜利、Hot Dice 标题 | 普通正文、链接、背景大面积 |
| `--color-wine` | 主按钮 fill、当前玩家指示 | 整页背景 |
| `--color-wood` | Header、Footer、Modal 遮罩上的 band | 骰子面、长文阅读区 |
| `--color-danger` | bust 提示、断线、表单错误 | 普通强调 |

### 2.3 阶段配色（GamePhase → 视觉）

| Phase | 背景 |  accent |
|-------|------|--------|
| `lobby` | canvas | wine CTA |
| `selecting` / `rolling` | surface 骰盘 | 正常 UI |
| `bust` | wood band + danger 文案 | 短动画后回 selecting |
| `hot_dice` | gold-wash 闪动 + gold 标题 | — |
| `game_over` | wood 全屏 | gold serif 胜利名 |

---

## 3. 字体与排版

### 3.1 字体栈（实现见 `src/app.css` + `index.html`）

```css
:root {
  --font-sans:    "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-display: "ZCOOL KuaiLe", "Cinzel Decorative", "Noto Sans SC", sans-serif;
  --font-serif:   "Cinzel Decorative", "ZCOOL KuaiLe", "Noto Sans SC", serif;
  --font-caption: "Noto Sans SC", sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;
}
```

| 角色 | 变量 | 用途 |
|------|------|------|
| 正文 | `--font-sans` | 全局正文、说明、表单 |
| 展示标题 | `--font-display` | 「亨利的骰桌」、菜单按钮标题、顶栏馆名 |
| 装饰标题 | `--font-serif` | 英文 FARKLE、阶段 overlay 标题（中文落快乐体） |
| 副标题 | `--font-caption` | 主菜单年代副标题 |
| 等宽 | `--font-mono` | 房间号、分数数字 |

**加载：** `index.html` 链 Google Fonts。国内网络可能 fallback 系统黑体；生产环境以部署后实机为准，可选自托管 `public/fonts/`。

**原则（来自 Starbucks）：**

- 同一 surface 不混用 sans + serif 正文
- 层级优先靠 **字重 + 颜色**，其次才是字号
- 正文不用纯黑，用 `--color-text`
- 负字距：标题 `-0.02em`，按钮 `-0.01em`

### 3.2 字号阶梯

| Token | 大小 | 字重 | 用途 |
|-------|------|------|------|
| `display` | 2.5rem / 40px | serif 600 | 胜利、大顺子 |
| `h1` | 1.5rem / 24px | sans 600 | 面板标题 |
| `h2` | 1.25rem / 20px | sans 600 | 子标题 |
| `score-lg` | 2rem / 32px | sans 700 | 总分、turnScore |
| `score-md` | 1.25rem / 20px | sans 600 | 玩家分数条 |
| `body` | 1rem / 16px | sans 400 | 说明、聊天 |
| `caption` | 0.875rem / 14px | sans 400 | 房间号、阶段提示 |
| `micro` | 0.75rem / 12px | sans 500 | 徽章、标签 |

---

## 4. 组件规范

### 4.1 按钮

**Primary（掷骰、开始游戏、收分）**

- Background: `var(--color-wine)`
- Color: `#fff`
- Radius: pill
- Padding: `0.5rem 1.25rem`
- Font: sans 600, 1rem
- Hover: `filter: brightness(1.08)`
- Active: `transform: scale(0.95)`
- Disabled: opacity 0.45, no pointer

**Secondary（取消、离开房间）**

- Background: transparent
- Border: 1px solid `var(--color-wine)`
- Color: `var(--color-wine)`

**Gold Outline（收分 — 当 turnScore > 0 且可选时）**

- Border: 2px solid `var(--color-gold)`
- Color: `var(--color-wine-deep)`
- 可选 subtle gold-wash 背景

**Icon FAB（移动端快捷掷骰，可选）**

- 56×56 圆，wine fill，`--shadow-fab`
- 仅 mobile breakpoint 显示

### 4.2 卡片（Card）

- Background: `var(--color-surface)`
- Radius: `var(--radius-card)`
- Shadow: `var(--shadow-card)`
- Padding: `var(--space-4)`
- Border: 1px solid `rgba(44, 24, 16, 0.06)`

用途：玩家信息、规则折叠、选骰列表。

### 4.3 骰盘（Dice Tray）

- 容器：surface + `--shadow-inset-tray`，模拟木盘凹槽
- 网格：6 格，`gap: var(--space-3)`，移动端 3×2，桌面 6×1 或 3×2
- 单枚骰子见 4.4

### 4.4 骰子（Die Tile）

| 状态 | 样式 |
|------|------|
| 默认 | `--color-die-face`，8px 圆角，深褐点/数字 |
| 可选中 hover | 外圈 2px wine |
| 已选（待 keep 确认前） | wine tint 背景 |
| kept | gold-wash + gold border |
| inactive | 灰化 + 降低 opacity |
| devil (face=0) | `--color-die-devil` 底 + gold 「恶魔之首」符号 |
| 掷骰动画 | 200–400ms rotate + scale，不阻塞操作 |

点数显示：优先 Unicode 骰子 ⚀–⚅ 或大号 serif 数字；devil 面不用 ⚀。

### 4.5 计分板（Score Panel）

- 双列：host | guest
- 当前行动玩家：左侧 4px wine 竖条或昵称 wine 色
- `totalScore`：score-md
- `turnScore`：score-lg + **gold**（仅当前玩家且 > 0）
- 目标分：caption，`{total} / {targetScore}`

### 4.6 顶栏 / 底栏

**Header（固定 top）**

- Background: `var(--color-wood)`
- Height: 56px
- 内容：Logo 字标（serif）、房间号 caption、连接状态点

**Action Bar（固定 bottom，对局阶段）**

- Background: `var(--color-wood)`
- 按钮组：掷骰 | 保留选中 | 收分 | 结束回合（按 phase 显隐）
- Safe area padding for mobile

### 4.7 表单（大厅）

- Input：白底、1px 边框 `#d4ccc4`、radius 8px、focus ring wine
- 房间号：大写、6 位、等宽 optional
- 错误：danger 文案 + danger-tint 背景

### 4.8 遮罩与 Toast

- **Phase toast**（bust / turn_end / hot_dice）：居中紧凑卡片，`pointer-events: none`，z-index 1500
- **终局结算卡**（`game_over`）：全屏深色渐变 + 金标题；含决胜一击区与双方终局比分；z-index 1600
- **离席通知卡**（`PartnerLeftOverlay`）：半透明遮罩 + 中性卡片；~3.2s 自动消失；z-index 1550
- **金币定先后**（`CoinFlipOverlay`）：z-index 1700（高于胜负遮罩，重开后不挡金币动画）
- **Toast / error**：顶栏下 slide-down，z-index **2100**（高于胜负遮罩）
- 对手离席**不用** error toast；不用 modal 堆 modal

---

## 5. 页面线框（信息架构）

### 5.1 路由（建议）

| 路径 | 视图 | 说明 |
|------|------|------|
| `/` | Lobby | 创建 / 加入 |
| `/room/:id` | Game | 根据 `state.phase` 切换子视图 |
| — | Rules（drawer/modal） | 规则说明 |

URL 示例：`https://farkle.yixr.uno/room/ABC123?name=亨利`（query 预填，optional）

### 5.2 Lobby — 主菜单（`/`）

```text
┌─────────────────────────────────────┐
│ ♛ 骰子酒馆              ● 已连接 [离开]│  Header
├─────────────────────────────────────┤
│      TavernAmbience（烛光 + 悬浮骰）    │
│              ♛                       │
│           骰子酒馆                    │
│   天国拯救2 · 特罗斯基，1403年         │
│   ┌─────────────────────────────┐   │
│   │   🎲  进入酒馆               │   │  烫金框 menu-btn--hero
│   │   开始你的骰子对决            │   │  图标/标题/副标题居中
│   └─────────────────────────────┘   │
│   ┌──────────────┬──────────────┐   │
│   │ 📖 骰子图鉴   │ 📜 规则说明   │   │  menu-btn--tile 双列
│   └──────────────┴──────────────┘   │
│            [ ⚙ 设置 ]               │  menu-btn--settings
├─────────────────────────────────────┤
│      联机 · farkle.yixr.uno          │  footer
└─────────────────────────────────────┘
```

弹层：`RulesSheet` / `SettingsPanel` / `DiceCollectionPanel`（全屏遮罩）。

### 5.2b Lobby — 进房（`JoinForm`）

```text
┌─────────────────────────────────────┐
│ ♛ 骰子酒馆    ABC123（可选）  ● 已连接  │
├─────────────────────────────────────┤
│  ← 返回主菜单（邀请链 `/room/:id` 无）   │
│  ┌───────────────────────────────┐  │
│  │ [新开一桌] | [加入牌局]        │  │
│  │ 旅人昵称: [________]          │  │
│  │ 房间暗号: [______]            │  │
│  │ [        进入酒馆        ]    │  │  btn-gilded 全宽
│  │ ▼ 怎么玩？                    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 5.3 Game（selecting 阶段）

```text
┌─────────────────────────────────────┐
│ ♛ 骰子酒馆   ABC123   ● 已连接 [离开] │
├─────────────────────────────────────┤
│ [你] 你 昵称 分 │ 目标 4000 │ 对手 … [对] │  GameHud（左你右对手）
├─────────────────────────────────────┤
│           game-page__stage           │  骰盘+计分垂直居中
│  ┌─────────────────────────────┐   │
│  │ 摇出骰子 + 可掷提示           │   │  DiceTable
│  │ [3][3][3][1][5][2]          │   │  mobile 3×2；≥768 六枚横排
│  └─────────────────────────────┘   │
│  ┌ 本轮累计 +N ┐ ┌ 当前回合累积 ┐   │  TurnScoreCard（无底部小字预览）
├─────────────────────────────────────┤
│ [重新掷骰] [计分并再次掷出] [计分并跳过] │  ActionBar
└─────────────────────────────────────┘
```

房内 `lobby` / `dice_selection` / `PhaseOverlay` 线框见 [UI-REVIEW.md](./UI-REVIEW.md) §4.4–4.6、4.9。

### 5.4 后续阶段 UI（Phase 2+，文档预留）

- `dice_selection`：双栏 DiceCard 网格，参考旧 `DiceSelector`
- `rps`：三按钮 + 等待对手
- `game_over`：终局结算卡（胜负 + 决胜一击 `lastTurnEnd` + 双方比分）+ 离开 / 再来一局
- 离席：`PartnerLeftOverlay` 自动消失；主动离开 SPA 回大厅（无整页刷新）

---

## 6. 响应式（手机 + 平板 + 桌面 Web）

> Memory.md §3 有完整实施与验收清单；此处为视觉 token 摘要。

| Breakpoint | 宽度 | 调整 |
|------------|------|------|
| mobile（默认） | < 640px | 骰子 3×2，fixed bottom ActionBar，safe-area |
| tablet | 640–1024px | 骰子 3×2 可放大，GameHud/TurnScoreCard 同构，Lobby 表单居中 |
| desktop | > 1024px | 骰盘 **≥768px 六枚横排**，`game-page__center` 居中，ActionBar 可非 fixed，header 56px |

```css
--layout-max-width: 960px;
--header-height: 56px;        /* desktop；mobile 见 Memory §3.2 为 48px */
--action-bar-height: 72px;
--die-size-mobile: 52px;
--die-size-desktop: 72px;
```

**原则：** Mobile-first 写 CSS，桌面是增强层；hover 仅作反馈，操作仍靠 click（与 Memory §3.10 一致）。

---

## 7. 动效与无障碍

### 动效

- 掷骰：CSS keyframes，**不**等动画结束才允许点击（state 以 WS 为准）
- bust：短 shake + danger 闪红 600ms
- hot_dice / 胜利：gold 脉冲 1s
- 尊重 `prefers-reduced-motion: reduce` → 仅 opacity 切换

### 无障碍

- 按钮 min-height 44px
- 骰子可 focus，Space 切换选中
- 阶段变化 `aria-live="polite"`
- 颜色对比：正文对 canvas ≥ 4.5:1

---

## 8. 资产清单

| 资产 | 状态 | 说明 |
|------|------|------|
| favicon.svg | 已有 | `public/favicon.svg` |
| UI 效果图 | 已有 | [`ui-reference-mockup.png`](./ui-reference-mockup.png) |
| 通用骰面 SVG | 已有 | `public/dice/ivory/face-*.svg`（图鉴/装饰） |
| 36 套主题骰面 | 已有 | `public/dice/{DieId}/`；`yarn dice:generate` |
| 图鉴六面改主题色 | 未做 | 对局已按 `die.type` 加载主题面 |
| 背景 texture | 可选 | CSS `TavernAmbience` 已够用 |
| 音效 | 未做 | 设置项已预留 |
| 骰杯倒出 / 真 3D | 未做 | Phase 2+ |

---

## 9. 与代码的对应（实现时）

| 设计 Token | 代码位置（计划） |
|------------|------------------|
| CSS 变量 | `src/app.css` |
| 主题类型 | `src/lib/ui/tokens.ts`（optional） |
| 组件 | `src/components/**` |
| 阶段 → 组件映射 | `src/views/GameView.svelte` |

---

## 10. 参考

- 模板源：[`design-md/starbucks/DESIGN.md`](../starbucks/DESIGN.md)
- 游戏阶段：[`src/lib/game/types.ts`](../../src/lib/game/types.ts) `GamePhase`
- 联机协议：[`src/lib/protocol/messages.ts`](../../src/lib/protocol/messages.ts)
- 生产 API：`wss://farkle.yixr.uno/room/{roomId}`

---

## 变更记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-06-03 | v0.1 | 初稿：Starbucks → 酒馆映射、组件与线框 |
| 2026-06-04 | §5 线框：主菜单烫金三钮、GameHud+双 TurnScoreCard、新 ActionBar 文案 |
| 2026-06-03 | v2 | 深色沉浸、组件落地；效果图归档为 `ui-reference-mockup.png` |
| 2026-06-03 | v2.1 | SVG 骰面 + Pixi/Matter 掷骰（已由 v2.2 替代） |
| 2026-06-04 | v2.2 | 36 套主题骰 SVG（`diceThemes.json`）；GSAP 四段掷骰；首掷 `face-hidden` |
| 2026-06-06 | v2.3 | `physicsRolling` 触发守卫（`prevRollCount`）；掷骰动画期间隐藏 `shortName` |
| 2026-06-06 | v2.4 | 快乐体展示字 + `OrnamentalDivider`；图鉴手机抽屉；对手选分/选骰摘要 |
