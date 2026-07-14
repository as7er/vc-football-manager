# VCFM — 会话记忆点（给后续 Agent / 自己）

> 用户要求「记住本次记忆点」。更新功能时请同步本文件关键条目。  
> 仓库：https://github.com/as7er/vcfm.git · 分支 `master`  
> 本地预览：`python -m http.server 8765 --bind 127.0.0.1` → `http://127.0.0.1:8765/`（勿用 `file://`）

## 项目形态

- 静态 SPA 足球经理；真源在 `js/match.js`（模拟），`matchview.js` 偏表现。
- 存档 localStorage；改 JS/CSS 后靠 **Service Worker 版本号** + 用户 **Ctrl+F5**。
- `sw.js`：**JS/CSS/HTML 网络优先**（v46 起），避免改队服/战术后仍吃旧缓存；当前 **`vcfm-v52`**。
- `index.html` 入口带 `?v=N` 与 SW `register("./sw.js?v=N")`，升版本时两边一起改。

## 近期已交付（勿重复造轮子）

| 主题 | 要点 | 关键文件 |
|------|------|----------|
| 合同/租借 | 续约、解约、外租/租入/召回 + UI | `contracts.js`, `loans.js`, `main.js` |
| 头像 v4 token | `size<=44` 球员走 `renderTokenAvatarSvg`：大肉色脸+短发帽+简化球衣 | `avatar.js` |
| 战术板头像尺寸 | 槽位/替补 `playerAvatarHtml(..., 40)`；`.player-dot .circle` 46px | `main.js`, `css/style.css` |
| **角色指令 v1** | `tactics.roles[]` 与 lineup 等长；槽位下拉；进球/助攻/抢断权重 + `teamRoleMods` 整队微量攻防 | `data.js` (`PLAYER_ROLES`), `models.js`, `match.js`, `main.js` |
| 落日城 `sunset` | 固定橙 `#f97316` + 紫 `#5b21b6` + sash | `clubs.js`, `models.js`, `avatar.js` |
| 战术深度 | 8 阵型 + `FORMATION_MOD`；风格克制；宽度/防线；预设 | `data.js`, `match.js` |
| 拖拽首发 | 槽位互换、替补拖上场、点选二次点击 | `main.js`, `models.js` |

## 战术对象（club.tactics）

```
formation, style, pressing, tempo, width, defensiveLine, lineup[], roles[]
```

- `lineup[i]` = 球员 id；`roles[i]` = 角色 id（`PLAYER_ROLES`）。
- 角色挂在**槽位**：换人/互换球员不改职责；换阵型 `autoLineup` 会 `ensureLineupRoles({reset:true})`。
- 读档用 `ensureTactics` → `ensureLineupRoles` 补齐。
- 角色表：门将；中卫盯人/出球；边卫防守/套边；后腰/工兵/前腰/边路；抢点/支点/内切。

## 用户偏好与沟通

- 界面与对话以**中文**为主；i18n 有 en 键时一并补。
- 改完视觉/缓存类问题：优先怀疑 SW；给清缓存/Unregister 步骤。
- 用户说「推到 GitHub」再 commit+push；说明用完整句 commit message。
- 工作区主目录：`F:\VCFM`。
- **FM 味路线图**：①角色指令（已做）→ ②队内讲话 → ③Inbox 信箱 → ④球探/对手报告 → ⑤中场换阵型+角色复盘。

## 已知缺口 / 可后续做

- ~~战术板角色指令~~ ✅ v52
- 队内讲话（赛前/中场 3～5 选项 → 士气 + 媒体）
- 统一 Inbox（董事会/报价/球探/球员诉求）
- 中场可改阵型+滑条，但直播条无换阵型
- 触屏 pointer 手势补强 HTML5 DnD
- 更多俱乐部队服主题（三处同步：clubs / models / avatar）

## 最近推送

- `e404cf8` — 头像 v4 token + 战术板 46px + SW v51  
- （本提交）角色指令 v1 + SW v52  

## 自测提醒

- 战术页：每人脚下有角色下拉；改「抢点/支点」等后摘要出现角色统计。
- 存档刷新后 `roles` 仍在；换阵型会重配默认角色。
- 比赛：前腰/套边更易助攻，抢点更易进球（统计感）。
- 落日城 token 头像：肉色脸 + 橙紫衣。
- 改完若仍旧：Unregister SW → Ctrl+F5。
