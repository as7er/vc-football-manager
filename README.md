# VCFM

[中文](#中文) · [English](#english)

---

## 中文

轻量网页足球经理（**V**C **F**ootball **M**anager 缩写），灵感来自 [Football Manager](https://www.footballmanager.com/)。纯前端、无后端，适合通勤摸鱼：手机浏览器打开就能玩。

> 粉丝向简化娱乐作品，与 Sports Interactive / SEGA 无关联。

### 在线游玩

**https://as7er.github.io/vcfm/**

| 说明 | 详情 |
|------|------|
| 设备 | 手机 / 平板 / 电脑浏览器均可 |
| 存档 | 当前浏览器 `localStorage`，**3 个槽位** |
| 换机 | 游戏内 **导出 / 导入** JSON（清缓存会丢进度） |
| 安装 | 支持 PWA：浏览器「添加到主屏幕」更像 App |
| 语言 | 中文 / English · 日间 / 夜间主题 |

仓库：https://github.com/as7er/vcfm

> 旧地址 `vc-football-manager` 在仓库重命名后会跳转一段时间；书签请改用上方新链接。

### 怎么玩（30 秒）

1. 选乙级球队 → **开始新赛季**  
2. **推进一天** / **推进到比赛日**（有比赛时会停）  
3. **进入比赛** → 快速模拟 / 直播 / 一键完赛（可调倍速 ×1/×2/×4）  
4. 中场可改战术、换人；赛后看报告  
5. 转会窗内买卖；随时 **存档**，换设备请 **导出**

### 主要系统

- **联赛**：超联 / 甲级 / 乙级，升降级 + **VCFM 杯**  
- **比赛**：情境（天气/德比）、细事件、中场干预、2D 俯视球场（镜头跟随、射门轨迹、点球员看卡）  
- **纪律**：累计黄牌停赛、红牌停赛；赛前简报；60'/75' 教练提示  
- **阵容**：体能、士气、伤病、潜力、球衣号码、自动阵容  
- **设施**：球场 / 训练 / 青训等级升级  
- **转会**：夏窗·冬窗、合同谈判（年限/周薪）、球探报告、AI 挖角报价  
- **经营**：董事会目标与解雇压力、职员、训练日程、周薪与设施维护  
- **生涯**：经理战绩、赛季结算页、俱乐部荣誉墙、球员分赛季历史与个人荣誉  
- **存档**：多槽、自动存、导出提醒（约 7 天未导出会提示）

### 本地运行

ES Module 需通过 HTTP 打开（不要直接双击 `index.html`）。

```bash
# Python
python -m http.server 8080
# open http://localhost:8080

# or Node
npx serve .
```

推送到 `master` 后 GitHub Pages 会更新在线版（可能有缓存，可强刷）。

### 技术栈

- 静态站点：HTML + CSS + ES Modules（无构建）  
- 进度：浏览器 `localStorage`  
- 部署：[GitHub Pages](https://pages.github.com/)  
- 可选离线：`manifest.webmanifest` + Service Worker

### 许可证

**[MIT License](./LICENSE)** — 可自由使用、修改、分发（含商业用途），请保留版权与许可证声明。游戏内随机生成的名称仅为玩法素材。

### 反馈

https://github.com/as7er/vcfm/issues

---

## English

A lightweight browser football manager (**V**C **F**ootball **M**anager). Inspired by [Football Manager](https://www.footballmanager.com/). Pure frontend, no backend — open it on your phone and play on the commute.

> Fan-made simplified entertainment. Not affiliated with Sports Interactive / SEGA.

### Play online

**https://as7er.github.io/vcfm/**

| | |
|--|--|
| Devices | Phone, tablet, or desktop browser |
| Saves | Browser `localStorage`, **3 slots** |
| Switch device | In-game **export / import** JSON (clearing cache wipes progress) |
| Install | PWA — “Add to Home Screen” for an app-like feel |
| Language | Chinese / English · day / night theme |

Repo: https://github.com/as7er/vcfm

> The old repo name `vc-football-manager` may redirect for a while after the rename; update bookmarks to the link above.

### How to play (30 seconds)

1. Pick a Division 3 club → **New season**  
2. **Advance one day** / **Advance to matchday** (stops when you have a match)  
3. **Enter match** → quick sim / live / instant (speed ×1 / ×2 / ×4)  
4. At half-time: tactics & subs; post-match report  
5. Buy/sell in the transfer window; **save** often; **export** when changing devices

### Features

- **Leagues**: three tiers with promotion/relegation + **VCFM Cup**  
- **Matches**: context (weather/derbies), detailed events, half-time orders, 2D pitch (camera follow, shot trails, click player cards)  
- **Discipline**: yellow accumulation bans, reds; pre-match briefing; 60'/75' coach tips  
- **Squad**: fitness, morale, injury, potential, kit numbers, auto XI  
- **Facilities**: stadium / training / youth upgrades  
- **Transfers**: summer & winter windows, contract negotiation (years/wages), scout reports, AI poaching bids  
- **Club**: board objectives & sack risk, staff, training schedule, wages & upkeep  
- **Career**: manager record, season review screen, club honours wall, player season history & individual awards  
- **Saves**: multi-slot, autosave, export reminder (~7 days)

### Run locally

Serve over HTTP (don’t open `index.html` as a file).

```bash
# Python
python -m http.server 8080
# open http://localhost:8080

# or Node
npx serve .
```

Pushing to `master` updates GitHub Pages (allow a short cache delay; hard-refresh if needed).

### Stack

- Static site: HTML + CSS + ES Modules (no build step)  
- Progress: browser `localStorage`  
- Hosting: [GitHub Pages](https://pages.github.com/)  
- Optional offline: `manifest.webmanifest` + Service Worker

### License

**[MIT License](./LICENSE)** — free to use, modify, and distribute (including commercially), with copyright and license notice retained. Generated player/club names are fictional gameplay content only.

### Feedback

https://github.com/as7er/vcfm/issues
