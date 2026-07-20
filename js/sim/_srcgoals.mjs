// 强弱对抗进球来源分解：定位球是否在抹平实力差？
// 用法：node js/sim/_srcgoals.mjs [场数] [主power] [客power]
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

const GAMES = Number(process.argv[2] || 30);
const PH = Number(process.argv[3] || 78);
const PA = Number(process.argv[4] || 52);
const src = {
  home: { open: 0, pen: 0, fkShot: 0, corner: 0, fkCross: 0 },
  away: { open: 0, pen: 0, fkShot: 0, corner: 0, fkCross: 0 },
};
let winH = 0, draw = 0, gh = 0, ga = 0;

for (let g = 0; g < GAMES; g++) {
  const eng = new SimEngine(makeClub("H", PH), makeClub("A", PA));
  for (let i = 0; i < 54000; i++) eng.step();
  gh += eng.score.home;
  ga += eng.score.away;
  if (eng.score.home > eng.score.away) winH++;
  else if (eng.score.home === eng.score.away) draw++;

  const evs = eng.events;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.type !== "goal") continue;
    const team = e.team;
    if (e.penalty) { src[team].pen++; continue; }
    // 回溯 10s 内最近的定位球脉络
    let tag = "open";
    for (let j = i - 1; j >= 0 && e.t - evs[j].t < 10; j--) {
      const p = evs[j];
      if (p.type === "shot" && p.freekick && e.t - p.t < 3) { tag = "fkShot"; break; }
      if (p.type === "corner" && p.team === team) { tag = "corner"; break; }
      if (p.type === "freekick" && p.team === team) { tag = "fkCross"; break; }
      if (p.type === "goalkick" || p.type === "throwin") break;
    }
    src[team][tag]++;
  }
}

console.log(`${GAMES} 场 ${PH} vs ${PA}：主 ${(gh / GAMES).toFixed(2)} - ${(ga / GAMES).toFixed(2)} 客   主胜 ${winH} 平 ${draw} 负 ${GAMES - winH - draw}`);
for (const t of ["home", "away"]) {
  const s = src[t];
  const tot = s.open + s.pen + s.fkShot + s.corner + s.fkCross;
  console.log(`${t === "home" ? "强" : "弱"}队进球 ${tot}: 运动战 ${s.open}  点球 ${s.pen}  直接FK ${s.fkShot}  角球后 ${s.corner}  FK吊传后 ${s.fkCross}`);
}
