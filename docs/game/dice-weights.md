# KCD2 骰子权重参考

> **运行时代码以 [`src/lib/game/diceRegistry.ts`](../../src/lib/game/diceRegistry.ts) 为准。**  
> 本目录 JSON 仅作对照、查阅与校对，改规则请直接改 `diceRegistry.ts`。

## 文件

| 文件 | 说明 |
|------|------|
| [`dice-weights.json`](./dice-weights.json) | 各骰 `DieId`、中文名、六面权重 `[1…6]`；`DevilDie` 含 `wildcardFace` |

## 权重含义

- 数组下标 `0…5` 对应骰面 **1～6** 的点数（与 `DieFace` 一致）。
- 数值越大，该面被掷出的相对概率越高（Worker 掷骰按此加权）。
- `DevilDie`：`wildcardFace: 1` 表示 **1 点** 显示为恶魔之首（`face=0`，计分百搭）。

## 与主题骰的关系

- **权重 / 名称 / 分类** → `diceRegistry.ts`（本目录 JSON）
- **配色 / 中心图标** → [`docs/dice/骰子模板.md`](../dice/骰子模板.md) → `src/lib/assets/diceThemes.json`

## 历史

原根目录 `docs/骰面.md` 为同名 JSON 的草稿，已迁入本目录并改为标准 `.json` 扩展名。
