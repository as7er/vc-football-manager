// 人墙任意球探针：统计任意球分级、直接射门/传中执行率与结果。
// 用法：node js/sim/_fk.mjs [场数]
import { SimEngine } from "./engine.js";

function makeClub(name, power) {
  const roles = ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "ATT", "ATT", "ATT"];
  const players = [], lineup = [];
  for (let i = 0; i < 11; i++) {
    const mean = power / 5;
    const g = () => Math.max(1, Math.min(20, Math.round(mean + (Math.random() - 0.5) * 5)));
    const id = `${name}-p${i}`;
    players.push({
      id, name: `${name}#${i}`, pos: roles[i], number: i + 1, fitness: 100,
      attrs: { pace: g(), shooting: g(), passing: g(), dribbling: g(), defending: g(), physical: g(),
        finishing: g(), tackling: g(), marking: g(), strength: g(), stamina: g(), vision: g(),
        reflexes: g(), handling: g(), positioning: g(), kicking: g() },
    });
    lineup.push(id);
  }
  return { name, players, tactics: { formation: "4-3-3", lineup } };
}

const GAMES = Number(process.argv[2] || 20);
let fkTotal = 0, fkShots = 0, fkShotGoals = 0, fkShotSaved = 0, fkShotBlocked = 0;
let fkCrosses = 0, fkCrossGoalsIn8s = 0, offsideAfterFk = 0;
let goals = 0, shots = 0, stalls = 0;

for (let g = 0; g < GAMES; g++) {
  const eng = new SimEngine(makeClub("H", 65), makeClub("A", 65));
  let maxStall = 0;
  for (let i = 0; i < 54000; i++) {
    eng.step();
    maxStall = Math.max(maxStall, eng._stallT || 0);
  }
  if (maxStall > 15) stalls++;
  goals += eng.score.home + eng.score.away;

  const evs = eng.events;
  shots += evs.filter((e) => e.type === "shot").length;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.type !== "freekick") continue;
    fkTotal++;
    // 任意球后 4s 内的第一个相关事件链
    for (let j = i + 1; j < evs.length && evs[j].t - e.t < 4.5; j++) {
      const f = evs[j];
      if (f.type === "shot" && f.freekick) {
        fkShots++;
        // 射门后 3s 内结果
        for (let k = j + 1; k < evs.length && evs[k].t - f.t < 3; k++) {
          const r = evs[k];
          if (r.type === "goal") { fkShotGoals++; break; }
          if (r.type === "save") { fkShotSaved++; break; }
          if (r.type === "block") { fkShotBlocked++; break; }
          if (r.type === "shot" || r.type === "freekick") break;
        }
        break;
      }
      if (f.type === "pass" && f.cross) {
        fkCrosses++;
        for (let k = j + 1; k < evs.length && evs[k].t - f.t < 8; k++) {
          if (evs[k].type === "goal") { fkCrossGoalsIn8s++; break; }
          if (evs[k].type === "freekick" || evs[k].type === "goalkick" || evs[k].type === "throwin") break;
        }
        break;
      }
      if (f.type === "offside") { offsideAfterFk++; break; }
      if (f.type === "pass" || f.type === "tackle" || f.type === "shot") break; // 快发短传等
    }
  }
}

console.log(`${GAMES} 场：`);
console.log(`任意球 ${(fkTotal / GAMES).toFixed(1)}/场（共 ${fkTotal}）`);
console.log(`直接射门 ${fkShots}（占任意球 ${Math.round((fkShots / Math.max(1, fkTotal)) * 100)}%）→ 进 ${fkShotGoals}（转化 ${Math.round((fkShotGoals / Math.max(1, fkShots)) * 100)}%）扑 ${fkShotSaved} 封堵 ${fkShotBlocked}`);
console.log(`吊传禁区 ${fkCrosses}（8s 内转化进球 ${fkCrossGoalsIn8s}）`);
console.log(`任意球后越位 ${offsideAfterFk}`);
console.log(`总进球 ${(goals / GAMES).toFixed(1)}/场  总射门 ${(shots / GAMES).toFixed(1)}/场  僵持(>15s)场次 ${stalls}/${GAMES}`);
