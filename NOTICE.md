# 致谢与版权声明

> 仓库：[yixr-github/ytq_KCD2-Farkle](https://github.com/yixr-github/ytq_KCD2-Farkle)  
> 在线游玩：[https://farkle.yixr.uno](https://farkle.yixr.uno)

---

## 1. 关于本项目

**骰子酒馆（ytq_KCD2-Farkle）** 是《天国拯救 2》（Kingdom Come: Deliverance 2）内置骰子小游戏 **Farkle** 的粉丝向、非官方网页复刻，支持双人联机对战。

本仓库在玩法与数据上参考了 KCD2 原作及社区资料，在工程实现上已进行**大规模独立改写**，包括但不限于：

- Cloudflare Worker + Durable Object 服务端房间（WebSocket）
- Svelte 5 前端与独立 UI 设计系统
- 主题骰 SVG 生成管线、GSAP 掷骰动画等

与下文「上游项目」的 P2P（WebRTC / Trystero）版本**不兼容**，亦**非**其未改名的镜像站。

---

## 2. 上游项目致谢（Fork 来源）

本项目最初 fork 自开源仓库：

**[luyu14039/KCD2-Farkle](https://github.com/luyu14039/KCD2-Farkle)**

感谢原作者在规则整理、早期 Web 实现与社区传播上的工作。当前仓库在联机架构、界面、部署与大量源代码上已与上游分叉，若你基于此仓库继续开发，请：

1. **保留本文件或 README 中的致谢与版权说明**；
2. 若再分发时使用了仍与上游高度相似的特定文件，建议在提交说明或文档中注明；
3. 遵守上游 README 中对二次传播的非商业与署名精神（见下文第 4 节）。

上游在线示例（P2P 版）：<https://luyu14039.github.io/KCD2-Farkle>

---

## 3. 《天国拯救 2》与 Warhorse Studios

《天国拯救 2》的游戏名称、美术风格、角色与设定等知识产权归 **Warhorse Studios s.r.o.** 及其权利人所有。

- 本项目为**粉丝同人二创**，与 Warhorse Studios **无任何官方关联**；
- **不得**声称本作品为官方、授权或商业产品；
- 若权利人认为本项目存在侵权，请通过 GitHub Issues 联系维护者，收到合理通知后将及时处理。

游戏内骰子名称、权重等数据来自玩家社区整理与原作体验，仅用于复刻玩法，不主张对原作内容的独占权利。

---

## 4. 使用与再分发（本仓库）

在适用法律允许的范围内，维护者对**本仓库新增与改写的代码与资源**作如下说明：

| 允许 | 禁止 |
|------|------|
| 个人学习、研究、非商业游玩 | 任何形式的**商业使用**（售卖、付费服务、广告变现等） |
| 非商业 Fork / 修改，并**注明本仓库及上游来源** | 冒用 Warhorse 或官方名义 |
| 在作品中保留本 NOTICE 或等效说明 | 去署名的再分发 |

**不提供任何明示或默示担保**；软件按「现状」提供，使用风险由使用者自行承担。

若你希望采用标准开源许可证（如 MIT）仅覆盖你完全原创的部分，请在合并上游或第三方内容前自行核对兼容性；本文件在发布初期优先阐明粉丝向与非商业立场。

---

## 5. 第三方依赖

主要开源依赖见 `package.json`、`worker/package.json`，包括但不限于：

- [Svelte](https://svelte.dev)
- [Vite](https://vitejs.dev)
- [GSAP](https://gsap.com/)
- [Vitest](https://vitest.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/) / Wrangler

字体（见 `index.html`）：Cinzel Decorative、Noto Serif SC、JetBrains Mono（Google Fonts）。

---

## 6. 维护者与联系

- GitHub：<https://github.com/yixr-github/ytq_KCD2-Farkle>
- 问题反馈：请使用仓库 **Issues**

---

*最后更新：2026-06-04*
