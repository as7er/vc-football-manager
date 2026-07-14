# VCFM — 会话记忆点（给后续 Agent / 自己）

> 仓库：https://github.com/as7er/vcfm.git · 分支 `master`  
> 本地预览：`python -m http.server 8765 --bind 127.0.0.1` → `http://127.0.0.1:8765/`  
> 当前缓存：**vcfm-v58**

## FM 味路线图（全部完成）

| # | 内容 | 状态 |
|---|------|------|
| ① | 角色指令 | ✅ |
| ② | 队内讲话 | ✅ |
| ③ | Inbox 信箱 | ✅ |
| ④ | 球探 / 对手报告 | ✅ |
| ⑤ | 中场换阵型 + 角色复盘 | ✅ v58 |

## ⑤ 要点

- 中场换阵型：`ensureMatchLineup` + `ensureLineupRoles({ reset: true })`
- 上半场角色复盘：`buildRoleReview(state, { untilMinute: 45 })`
- 下半场角色下拉：中场面板 `#match-ht-roles`
- 场边条可换阵型：`#live-formation` → `applyLiveTactics`
- 赛后战报：角色复盘块

## 其它速查

- 讲话：`TEAM_TALKS` / `applyTeamTalk`
- 信箱：`js/inbox.js` · `processInboxDay`
- 球探：`scoutFogLevel` · `buildOpponentReport`
- 体能：展示与写入取整

## 用户偏好

- 中文为主；说「推到 GitHub」再 commit+push
- 主目录：`F:\VCFM`
- **勿用 PowerShell `Set-Content` 写含中文的源码**（易破坏 UTF-8）；用编辑器或 Python `Path.write_text(..., encoding='utf-8')`
- SW 缓存：Unregister 或升版本号

## 最近提交

- `38d313a` — talks + inbox + scout (v57)
- `93e4be2` — HT roles（曾破坏 UTF-8，已修复提交覆盖）
- 本提交：UTF-8 修复 + ⑤ 功能确认 v58
