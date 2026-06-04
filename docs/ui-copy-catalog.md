# UI 文案清单（弹窗 / 遮罩 / Toast / 提示）

> 改措辞时按本表定位源码文件。动态插值用 `{变量}` 表示。  
> 最后核对：2026-06-04

---

## 1. 阶段提示（`PhaseOverlay.svelte`）

> **布局：** `bust` / `turn_end` / `hot_dice` 为**底部紧凑条**（非全屏）；`game_over` 仍为居中弹窗。  
> **Hot Dice：** 对局多为 `DiceBoard` 盘内轻提示「六枚全胜 · 点击掷骰」，较少进入 `hot_dice` 遮罩。

### 1.1 阶段遮罩文案

| 场景 | 标题 | 副标题 | 附注 |
|------|------|--------|------|
| `bust`（己方爆点） | 本轮作废 | 以下骰面无法得分，本回合清零 | 展示 `lastBust` 中**未保留**的骰面 |
| `bust`（对手爆点，轮到你） | 轮到你了 | `{who} 爆点，该你掷骰了` | `who` = `bustPlayerName` 或对手名 |
| `hot_dice`（若仍触发遮罩） | 全部得分 | 六枚得分，再来一轮 | 约 3s 自动消失 |
| `turn_end`（轮到你） | 轮到你了 | 该你掷骰了 | — |
| `turn_end`（对手计分并跳过） | 计分成功 | `等待 {opponentName} 掷骰` | — |
| `game_over`（你赢） | 你赢了！ | 恭喜计分达标 | **离开房间** / **再来一局**（房主） |
| `game_over`（你输） | 胜局已定 | `{winnerName} 赢了` 或 `对局结束` | 同上 |
| `game_over`（非房主） | — | — | 附言：**等待房主重开…** |

默认 `opponentName` 回退：**对手**

---

### 1.2 规则说明 `RulesSheet.svelte`（大厅 / 游戏内均可打开）

| 元素 | 文案 |
|------|------|
| 标题 | 规则说明 |
| 导语 | 轮流掷骰、计分并保留组合，可继续再掷或计分并跳过。先达到目标分数者胜。 |
| 要点 1 | 1 → 100 分，5 → 50 分 |
| 要点 2 | 三条、顺子有额外加分 |
| 要点 3 | 无得分骰即本轮作废，本回合得分清零 |
| 要点 4 | 六枚皆可计分时为全部得分，可再掷一轮 |
| 小节标题 | 得分表 |
| 得分表数据 | 见 `src/lib/ui/scoreRules.ts`（如「三个 1」「1-2-3-4-5-6」等） |

---

### 1.3 设置 `SettingsPanel.svelte`

| 元素 | 文案 |
|------|------|
| 标题 | 设置 |
| 选项 | 掷骰物理动画 |
| 说明 | 关闭后使用轻量 CSS 旋转；系统「减少动态效果」也会自动关闭。 |
| 脚注 | 音效与背景音乐将在后续版本接入。 |

---

### 1.4 骰子图鉴 `DiceCollectionPanel.svelte`

| 元素 | 文案 |
|------|------|
| 标题 | 骰子图鉴 |
| 副标题 | 共 N 种 · 数据与选骰页一致 |
| Tab | 全部 / 普通 / 幸运 / 邪恶 / 神圣 / 诡计 / 特殊（`CATEGORY_LABELS`） |
| 图例 | 与 `DiceWeightLegend`、选骰页相同 |
| 详情 | 缩写、分类、恶魔百搭说明（若有）、选骰提示 |
| 数据 | `diceRegistry` + `DiceCard` + `weightTiers` |

---

## 2. 半屏 / 卡片式（非 fixed 全屏，但对局内 modal 感）

### 2.1 房内规则设置 `RulesConfigPanel.svelte`

| 元素 | 文案 |
|------|------|
| 返回 | ← 返回 |
| 标题 | 游戏规则设置 |
| 字段 | 目标分数 |
| 字段 | 特殊骰子数量 |
| 分段选项 | 不使用 / 1 / 2 / 3 |
| 提示 | 每人可选择的特殊骰子上限 |
| 确认按钮 | 确认规则，开始游戏 |
| 校验错误 | 见 §5.2 `validateConfig` |

---

### 2.2 房内等待 `GameView.svelte`（`phase === lobby`）

| 条件 | 文案 |
|------|------|
| 房主复制按钮（默认） | 复制房间暗号 |
| 房主复制按钮（已复制） | 已复制暗号 |
| 邀请链接（默认） | 复制邀请链接 |
| 邀请链接（已复制） | 已复制链接 |
| 满员 · 房主 | 对手已连接！ |
| 满员 · 客人 | 已连接！等待房主开始游戏… |
| 未满员标题 | 牌桌已备好 |
| 未满员说明 | 等人到齐后，房主即可开局。 |
| 玩家角色 | 房主 / 客人 |
| 未入座 | 尚未入座… |
| 房主按钮 | 设置规则 |

---

### 2.3 不支持阶段占位 `GameView.svelte`

| 文案 |
|------|
| 该阶段（`{phase}`）尚未支持，敬请期待。 |

---

## 3. Toast / 顶栏错误条（`session.lastError`）

来源：`gameSession.svelte.ts`（客户端）+ Worker `session.ts`（经 WS 下发，原文展示）

### 3.1 客户端固定

| 文案 | 触发 |
|------|------|
| 连接已断开 | WS onClose |
| 昵称不能为空 | connect 前校验 |
| 房间号不能为空 | connect 前校验 |
| 无法连接服务器 | connect 失败 |

### 3.2 服务端 `worker/src/session.ts`

| 文案 |
|------|
| 昵称不能为空 |
| 房间已满 |
| 仅房主可开始游戏 |
| 游戏进行中 |
| 等待第二名玩家加入 |
| 当前不能选骰 |
| 本局不使用特殊骰子 |
| 请选择 {n} 枚特殊骰子 |
| 不能重复选择同一枚骰子 |
| 无效的特殊骰子 |
| 你已确认选骰 |
| 还没轮到你 |
| 当前不能掷骰 |
| 请先选择要保留的骰子 |
| 没有可掷的骰子 |
| 当前不能选骰（keep 时 phase 不对） |
| 请选择至少一枚骰子 |
| 无效选择 |
| 当前不能收分 |
| 本回合还没有得分 |

### 3.3 Worker `game-room.ts` 包装错误

| 文案 |
|------|
| 无效消息格式 |
| 无效的选骰请求 |
| 无效的保留请求 |
| 请先加入房间 |
| 选骰失败，请重试 |
| 操作失败，请重试 |

---

## 4. 大厅 `LobbyView` / `MainMenu` / `JoinForm`

### 4.1 主菜单 `MainMenu.svelte`

| 元素 | 文案 |
|------|------|
| 标题 | 骰子酒馆 |
| 副标题 | 天国拯救2 · 特罗斯基，1403年 |
| 主按钮 | 进入酒馆 — 副：开始你的骰子对决 |
| 左瓦片 | 骰子图鉴 — 副：查看所有骰子组合 |
| 右瓦片 | 规则说明 — 副：了解游戏规则 |
| 底栏 | 设置 |

### 4.2 进房表单 `JoinForm.svelte`

| 元素 | 文案 |
|------|------|
| Tab | 新开一桌 / 加入牌局 |
| 标签 | 旅人昵称 |
| 占位 | 例如：亨利 |
| 标签 | 房间暗号 |
| 占位 | 6 位房间码 |
| 新开桌提示 | 进入时自动分配房间暗号，无需手动填写。 |
| 提交 | 进入酒馆 / 推门中… |
| 规则折叠 | 怎么玩？ / 收起规则 |
| 内嵌规则 | 与 RulesSheet 要点一致；导语为「先至 4000 分者胜」 |
| 本地错误 | 请输入昵称 / 请输入房间暗号 |

### 4.3 大厅页脚

| 文案 |
|------|
| 联机 · farkle.yixr.uno |

### 4.4 返回

| 文案 |
|------|
| ← 返回主菜单 |

---

## 5. 选骰阶段 `DiceSelector.svelte`

| 元素 | 文案 |
|------|------|
| 标题 | 选择特殊骰子 |
| 说明 | 请选择 {specialCount} 枚（对手不可见） |
| 图例 | 高概率 / 常态 / 低概率 / 无法掷出 |
| 状态 | 已选 {n} / {N} · 已确认 / ：未选择 |
| 分类标题 | 幸运 / 邪恶 / 神圣 / 诡计 / 特殊（`CATEGORY_LABELS`） |
| 确认按钮 | 确认选择（{n}/{N}） |
| 提交中 | 提交中… |
| 等待 | 等待对手选骰… / 双方选骰完成，即将开始…（`getDicePickWaitText`） |
| 卡片标签 | 各骰 `category` 中文（`DiceCard` tag） |
| 面 tooltip | `点数 {face}：无法掷出` / `点数 {face}：约 {pct}%` |

---

## 6. 对局内非弹窗提示

### 6.1 顶栏 `Header.svelte`

| 状态 | 文案 |
|------|------|
| 连接中 | 连接中 |
| 已连接 | 已连接 |
| 未连接 | 未连接 |
| 按钮 | 离开 |

### 6.2 对局 HUD `GameHud.svelte`

| 元素 | 说明 |
|------|------|
| 布局 | 左「你」、中「目标」、右「对手」 |
| 头像 | `public/avatars/hud-you.jpg` / `hud-opponent.jpg`（固定图，非首字母） |
| 文案 | 你 / 对手 / 等待加入… / 目标 |
| 当前回合 | 玩家名旁 ♛ |

### 6.3 底栏 `ActionBar.svelte`

| 场景 | 文案 |
|------|------|
| 等待对手 | 等待 {opponentWaitName} 掷骰… |
| 首掷（仅 `rollCount===0`） | 开骰 / 掷骰 |
| 掷后两钮 | 继续·计分并继续投（保留选中骰并自动掷剩余）/ 结束·计分并结束（保留选中骰并收分换手）；有本轮分时可无选中直接结束 |
| 选骰等待 | 来自 `dicePickWaitText` |
| 大厅等待 | 来自 `lobbyWaitText`（见 §7） |

### 6.4 骰盘 `DiceBoard.svelte`

| 文案 |
|------|
| 已保留 |
| 命运旋转中… |
| 等待掷骰… |
| 全部得分 — 可再掷全部六枚 |

### 6.5 回合分 / 掷骰次数

| 组件 | 文案 |
|------|------|
| TurnScoreCard | 本轮累计（选中预览 `+N`）/ 当前回合累积（已确认 `turnScore`） |
| ~~ThrowPips~~ | 已从 UI 移除（`rollCount` 仍由服务端维护） |
| DiceTable 提示 | 点击骰子区域即可重新摇骰（己方回合且可掷时） |
| DiceTable 标题 | 摇出骰子 |
| ActionBar | 掷骰（首掷）/ 计分并继续投 / 计分并结束 |
| ~~ScoreRulesPanel~~ | 已从对局页移除；得分表见 `RulesSheet` |

### 6.6 组合横幅 `ComboBanner`（全屏非 modal，`scoringLabels.ts`）

| 键 | 当前英文文案 |
|----|----------------|
| straight | STRAIGHT! |
| full_house | FULL HOUSE! |
| three_of_a_kind | THREE OF A KIND! |
| four_of_a_kind | FOUR OF A KIND! |
| five_of_a_kind | FIVE OF A KIND! |
| six_of_a_kind | SIX OF A KIND! |

### 6.7 加载态 `GameView.svelte`

| 文案 |
|------|
| 正在推门进入… |
| 无法连接房间 |

---

## 7. 动态拼接文案（`GameView` / `gameSession`）

### 7.1 底栏大厅等待 `lobbyWaitText`

| 条件 | 文案 |
|------|------|
| 房主，未满员 | 等待对手入座… |
| 客人，未满员 | 等待对手入座… |
| 客人，满员 | 已连接！等待房主开始游戏… |
| 房主满员 | （空，显示设置规则按钮） |

---

## 8. 酒馆语录（随机提示）

数据与选取：`src/lib/ui/tavernQuotes.ts`（100 条，5 位 NPC）。展示：`TavernQuoteBar.svelte`。触发封装：`useTavernQuote.svelte.ts`。

| 位置 | 说明 |
|------|------|
| 主菜单 | 副标题与按钮区之间；`menu` 池，28s 轮播；20s 无操作 `idle` |
| 对局 | `GameHud` 与 `DiceTable` 之间；按事件换句 |

| trigger | 时机 |
|---------|------|
| `menu` | 主菜单 |
| `game_start` | 进入 `selecting` 且 `rollCount === 0`（每局一次） |
| `reroll` | 己方 `rollCount` 增加 |
| `big_score` | 选中预览 ≥1000 或单次 keep 增量 ≥1000 |
| `bust` | `phase === bust` |
| `win` / `lose` | `phase === game_over` |
| `combo` | 检测到三连等组合 |
| `idle` | 己方 `selecting` 回合 20s 无操作 |

改台词：编辑 `tavernQuotes.ts` 中 `TAVERN_QUOTES`（勿改 plan 附件）。

### 8.1 特殊骰标注

| 元素 | 文案 |
|------|------|
| 展示 | `DiceBoard.svelte`：非 `NormalDie` 的骰子下方显示 `shortName`（分类色） |
| 语录样式 | `TavernQuoteBar`：半透明对话框，非羊皮纸底 |

---

## 9. 无障碍 / 仅 aria（一般不改措辞，可选统一）

| 位置 | 文案 |
|------|------|
| 各弹窗关闭钮 | 关闭 |
| DicePiece | 恶魔之首 / 骰子 {value} |
| PhaseOverlay | aria-labelledby → 标题文本 |

---

## 10. 修改时常见文件速查

| 改什么 | 文件 |
|--------|------|
| 爆点 / 胜负 / Hot Dice 遮罩 | `src/components/game/PhaseOverlay.svelte` |
| 规则弹窗 | `src/components/lobby/RulesSheet.svelte` + `JoinForm` 内嵌 |
| 设置弹窗 | `src/components/lobby/SettingsPanel.svelte` |
| 收藏弹窗 | `src/components/lobby/DiceCollectionPanel.svelte` |
| 规则配置卡片 | `src/components/lobby/RulesConfigPanel.svelte` |
| 红色 Toast | `src/lib/client/gameSession.svelte.ts` + `worker/src/session.ts` |
| 选骰页 | `src/components/selection/DiceSelector.svelte` |
| 底栏按钮 | `src/components/layout/ActionBar.svelte` |
| 组合大字 | `src/lib/ui/scoringLabels.ts` |
| 酒馆语录 | `src/lib/ui/tavernQuotes.ts` + `TavernQuoteBar.svelte` |
| 特殊骰下方标注 | `DiceBoard.svelte` |
| 对局规则弹窗 | `DiceTable`「规则」→ `RulesSheet.svelte` |
