# KCD2 Farkle 设计系统

本项目 UI 规范（**v2 深色沉浸**），用于 [ytq_KCD2-Farkle](https://github.com/yixr-github/ytq_KCD2-Farkle) / [farkle.yixr.uno](https://farkle.yixr.uno)。

**维护者 / Agent 请先读：** [Memory.md](../../Memory.md) §0–§2（再回本目录改视觉）。

- **完整规范：** [DESIGN.md](./DESIGN.md)
- **效果图参考：** [ui-reference-mockup.png](./ui-reference-mockup.png)
- **界面评审说明：** [UI-REVIEW.md](./UI-REVIEW.md)（结构、线框、对照清单）
- **前端实施备忘：** [Memory.md](../../Memory.md)（含主题骰 SVG、掷骰动画、变更表）
- **界面文案：** [../ui-copy-catalog.md](../ui-copy-catalog.md)
- **骰子权重参考：** [../game/dice-weights.md](../game/dice-weights.md)（源码 `diceRegistry.ts`）
- **骰子主题库：** [../dice/骰子模板.md](../dice/骰子模板.md)（`diceThemes.json` + `yarn dice:generate`）
- **文档索引：** [../README.md](../README.md)

**UI 现状摘要：** 主菜单全宽「进入酒馆」+ 双列图鉴/规则 + 设置；对局 HUD 固定 JPG 头像；回合分双羊皮纸卡；对局骰子按类型加载主题 SVG（首掷 `face-hidden`，掷出后 `face-1`…`6`）；图鉴六面预览仍用 `public/dice/ivory/` 通用面。

**线框（ASCII）：** 以 [UI-REVIEW.md §4](./UI-REVIEW.md#4-界面线框) 为评审线框；[DESIGN.md §5](./DESIGN.md#5-页面线框信息架构) 为 IA；实施细节见 [Memory.md §3.5](../../Memory.md)。
