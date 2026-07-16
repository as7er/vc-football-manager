# VCFM — 会话记忆点

> 仓库：https://github.com/as7er/vcfm.git · `master`  
> 预览：`python -m http.server 8765 --bind 127.0.0.1`  
> 缓存：**vcfm-v103**（球队统一抢断；球权稳定窗；固定接应通道；禁直接回传）

## 已完成路线

### FM ①–⑤
角色 · 讲话 · Inbox · 球探雾/对手报告 · 中场换阵+角色复盘

### ABCD 扩展（v59）

| 线 | 内容 | 文件 |
|----|------|------|
| **A** | 关系 -2..+2、约谈、氛围、对立发信 | `relations.js` |
| **B** | 紧急信箱门闸、球探任务、关注过滤 | `worldpulse.js`, `main.js` |
| **C** | 战术板 pointer 拖拽、港湾/钢铁/磨坊队服 | `main.js`, `clubs.js`, `models.js`, `avatar.js` |
| **D** | 财政简报、青训周报、世界新闻、成就徽章 | `worldpulse.js`, 概览 UI |

### 比赛引擎 v2（P0–P5）

| 阶段 | 内容 | 文件 |
|------|------|------|
| P0–P4 | 空间模拟、决策、防守、裁判、平衡缩放 | `js/sim/engine.js`, `sim-viewer.html` |
| **P5** | 用户场接入主游戏；AI 后台仍概率引擎 | `js/sim/adapt.js`, `js/match.js` |
| **直播投影** | 录帧 + `applySimSnapshot`，关导演 AI | `matchview.js`, `main.js` driveMatchEvent |

- 开关：`USE_SIM_ENGINE`（`js/sim/adapt.js`）
- 用户场：`SimEngine` 跑半场 → `directResult` → 现有 event/报告/积分（比分与直播帧同源）
- **直播**：用户场 10Hz 录帧 → 高光窗切片真投影；进球只走一次横幅/底栏文案
- AI 场：仍 `tryAttack` 概率，保证推进日不卡
- 预览手感：`sim-viewer.html`（raw，非 scaled）
- 缓存 **vcfm-v103**
- **netHit**：仅脉冲一帧 + 球门线附近才播网效
- **角球**：高光窗半场≤3；禁区约 5v5 不糊；**主罚人显示层钉在角旗球旁**；徽章开出后 ~2s 清掉（不粘整段）
- 战术涌现：前锋回撤、边锋内切、边卫套边、核心绝对权（`ensureCorePlayer` 主客都有）
- 表现层：`compactSimFrame.ball.z` → 空中球阴影/缩放；simDrive **软跟镜**；球轨迹丝带
- **持球光环**：只认 ball.owner 且贴球；飞行中绝不亮；sim 驱动不用 touchUntil 拖影
- **进球直播**：真实射门/入网帧 → 短 hold → 引擎真实庆祝；`_beginGoalBeat` 仅留给旧编舞路径
- **画面分离**：sim `_separateAgents` 双轮；Canvas 圆点半径 6–8px，不再二次改逻辑坐标
- 导演：高光慢镜；**FMM 全场稳镜**；进球 hold 中不灌后续 sim 帧冲散庆祝
- FMM UI：横条棋盘草坪 + 两侧看台；底栏 **解说 ticker ↔ 控球条**；自动重播+跳过
- 门架：端线外侧；入网撞击加强
- 庆祝：最多 5 人分槽自然围拢；无半瞬移；高光在开球复位前结束
- 进球/慢镜：`mp-goal-flash` 与 `mp-replay-slow::after` 同时存在时重置徽章边界，禁止全场紫色遮罩
- 越位：按出脚瞬间快照所有越位位置球员；回到线上接球仍吹；角球/界外球/门球首脚豁免
- 传球：直接回传降权；直塞只在最后防线附近生成；门将主动处理低平身后球
- 抢断：仅球队指定 presser 下脚；球权转换后 4s 组织窗；个人/全队抢断冷却
- 进攻站位：边锋保持左右宽度，中场按固定 lane 接应；最后三区仅一名中场前插
- 门将：轨迹扑救；空门降扑救；抱稳/托出；圆点侧移残影；压迫必大脚
- 助攻：lastPasser → assistId；高光窗提前
- 球：落地弹跳 + 射门橙黄轨迹

## 关键 API

- `applyPlayerTalk` / `clubAtmosphere` / `relationLabel`
- `startScoutMission(region)` region: `div3`|`div2`|`intl`
- `financeSnapshot(world)`
- `checkManagerBadges` / `noteUserMatchResult`
- `world.scoutMissions[]` · `managerCareer.badges[]`
- `shouldUseSim` / `ensureSimEngine` / `SimEngine.directResult({tMin,tMax})`
- `SimEngine.scaledResult(...)` 仅供历史平衡诊断，正式用户比赛禁止调用

## 注意

- 勿用 PowerShell `Set-Content` 写中文源码
- 主目录 `F:\VCFM`；说推 GitHub 再 push
- 用户场单场模拟约 1.5–3s（手机可接受）；勿对全联赛后台启用 v2
