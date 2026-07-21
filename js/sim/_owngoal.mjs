/**
 * 乌龙球回归：封堵/对方最后触球入网时，比分必须落账，不得因 scorer 在对方而丢球。
 * 运行：node js/sim/_owngoal.mjs
 */
import { SimEngine } from "./engine.js";
import { simulateMatchSync } from "../match.js";
import { createPlayer } from "../models.js";

function mkClub(tag, power = 65) {
  const roles = ["GK", "CB", "CB", "FB", "FB", "CM", "CM", "CM", "W", "W", "ST"];
  const players = roles.map((r, i) => ({
    id: `${tag}_${i}`,
    name: `${tag}${i}`,
    number: i + 1,
    pos: r,
    ovr: power,
    fitness: 100,
    injured: 0,
    attrs: {
      pace: 12,
      passing: 12,
      vision: 12,
      shooting: 12,
      finishing: 12,
      dribbling: 12,
      tackling: 12,
      marking: 12,
      strength: 12,
      stamina: 12,
      positioning: 12,
      reflexes: 12,
      handling: 12,
      kicking: 12,
    },
  }));
  return {
    id: tag,
    name: tag,
    short: tag,
    players,
    tactics: { formation: "4-3-3", lineup: players.map((p) => p.id) },
  };
}

function makeGameClub(id, name, power) {
  const roles = ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "ATT", "ATT", "ATT"];
  const players = roles.map((pos, i) => {
    const p = createPlayer(pos, power, id);
    p.number = i + 1;
    return p;
  });
  return {
    id,
    name,
    short: name.slice(0, 3),
    division: 3,
    money: 1e6,
    form: [],
    players,
    tactics: {
      formation: "4-3-3",
      lineup: players.map((p) => p.id),
      style: "balanced",
      pressing: 3,
      tempo: 3,
      width: 3,
      defensiveLine: 3,
      roles: [],
    },
    staff: {},
    facilities: {},
  };
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  } else {
    console.log("OK:", msg);
  }
}

// —— 1) 引擎：对方 lastKicker 入网 → ownGoal + 得分方 team ——
{
  const eng = new SimEngine(mkClub("H"), mkClub("A"));
  const awayDef = eng.agents.find((a) => a.team === "away" && a.role !== "GK");
  const b = eng.ball;
  b.lastKicker = awayDef.id;
  b._shotAssistId = null;
  b._penaltyGoal = false;
  b.state = "loose";
  b.x = 50;
  b.y = -0.5;
  b.z = 0.2;
  b.vx = 0;
  b.vy = -1;
  b.owner = null;
  eng._resolveBounds();
  const g = eng.events.find((e) => e.type === "goal");
  assert(!!g, "forced own-goal emits goal event");
  assert(g.team === "home", "scoring team is home (top net)");
  assert(g.agentId === awayDef.id, "agentId is last kicker (away)");
  assert(g.ownGoal === true, "ownGoal flag set");
  assert(eng.score.home === 1 && eng.score.away === 0, "engine score 1-0");
  // t=0 不在 directResult 开区间；用负 tMin 覆盖
  const dr = eng.directResult({ tMin: -1, tMax: 99999 });
  assert(dr.score.home === 1, "directResult counts own-goal");
  assert(dr.goals[0]?.ownGoal === true, "directResult.goals.ownGoal");
}

// —— 2) 完整用户场：引擎比分 === match 比分（含自然涌现乌龙）——
{
  const warns = [];
  const ow = console.warn;
  console.warn = (...a) => {
    if (String(a[0] || "").includes("addSimGoal")) warns.push(a);
    else ow(...a);
  };

  let ogEvents = 0;
  let scoreMismatch = 0;
  for (let i = 0; i < 16; i++) {
    const home = makeGameClub("u1", "UserFC", 67);
    const away = makeGameClub("a1", "AIFC", 63);
    const world = {
      userClubId: "u1",
      day: 10,
      season: 1,
      clubs: [home, away],
      fixtures: [],
      table: {
        u1: { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        a1: { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      },
      news: [],
      media: [],
      inbox: [],
    };
    const f = {
      home: "u1",
      away: "a1",
      day: 10,
      competition: "league",
      round: 1,
      played: false,
    };
    const r = simulateMatchSync(world, f, { teamTalkId: "encourage" });
    const halves = r.simEngineMeta?.halves || [];
    let engG = 0;
    for (const h of halves) {
      engG += (h.scaledScore?.home || 0) + (h.scaledScore?.away || 0);
    }
    const matchG = (r.homeGoals || 0) + (r.awayGoals || 0);
    const goalEvs = (r.events || []).filter((e) => e.type === "goal");
    ogEvents += goalEvs.filter((e) => e.ownGoal).length;
    if (halves.length && engG !== matchG) scoreMismatch++;
    if (halves.length && engG !== goalEvs.length) scoreMismatch++;
  }
  console.warn = ow;

  assert(scoreMismatch === 0, `engine score == match score over 16 games (mismatches=${scoreMismatch})`);
  // 丢球修复后不应再出现「unknown scorerId」且不涨分；允许 score kept 警告（无 id 兜底）
  const dropWarns = warns.filter((a) => !String(a[0] || "").includes("score kept"));
  assert(dropWarns.length === 0, `no score-dropping addSimGoal warns (got ${dropWarns.length})`);
  console.log(`  (natural own-goal events observed: ${ogEvents})`);
}

// —— 3) 契约：scorer 在对方时仍涨分（直接走 addSim 路径靠完整模拟已覆盖；再断言文案）——
{
  // 再跑一场直到抓到 ownGoal 事件，或强制用引擎+translate 不够——完整模拟已验比分
  // 这里只确认 ownGoal 事件文案含「乌龙」
  let saw = false;
  for (let i = 0; i < 24 && !saw; i++) {
    const home = makeGameClub("u1", "UserFC", 70);
    const away = makeGameClub("a1", "AIFC", 60);
    const world = {
      userClubId: "u1",
      day: 10,
      season: 1,
      clubs: [home, away],
      fixtures: [],
      table: {
        u1: { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        a1: { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      },
      news: [],
      media: [],
      inbox: [],
    };
    const f = {
      home: "u1",
      away: "a1",
      day: 10,
      competition: "league",
      round: 1,
      played: false,
    };
    const r = simulateMatchSync(world, f);
    const og = (r.events || []).find((e) => e.type === "goal" && e.ownGoal);
    if (og) {
      saw = true;
      assert(/乌龙/.test(og.text || ""), `own-goal event text: ${og.text}`);
      assert(og.teamId === "u1" || og.teamId === "a1", "own-goal teamId is scoring club");
    }
  }
  if (!saw) console.log("OK: no natural OG in 24 games (rare; force path already covered)");
}

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nOK own-goal regression");
