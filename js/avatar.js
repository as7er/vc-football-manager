/**
 * 程序生成像素头像（球员 / 职员 / 经理）——90 年代热血系列（くにおくん）画风
 *
 * v5 全面重绘：16×16 逻辑像素网格 + SVG crispEdges，SD 大头、粗黑描边、
 * 方块发型（飞机头/平头/刺猬/锅盖/爆炸头等）、热血式怒眉。
 * 肤色/发色/发型按球员国籍的地区画像加权分配（稳定哈希种子）；
 * 心情系统保留：neutral 怒眉、happy 咧嘴、injured 绷带X眼、tired 汗滴、sad 垂眉。
 * 对外 API 与 v4 完全兼容：moodFromPlayer / renderAvatarSvg / avatarHtml /
 * playerAvatarHtml / staffAvatarHtml。
 */

/** @typedef {'neutral'|'happy'|'injured'|'sad'|'tired'} AvatarMood */

// ============================================================
// 基础工具
// ============================================================

function hashStr(s) {
  let h = 2166136261;
  const str = String(s || "x");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
}

function shiftHex(hex, delta) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#") || hex.length < 7) {
    return hex || "#334155";
  }
  const clamp = (n) => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(hex.slice(1, 3), 16) + delta);
  const g = clamp(parseInt(hex.slice(3, 5), 16) + delta);
  const b = clamp(parseInt(hex.slice(5, 7), 16) + delta);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** 两色混合（t=0 全 a，t=1 全 b） */
function mixHex(a, b, t) {
  if (!a?.startsWith?.("#") || a.length < 7) return b || a || "#334155";
  if (!b?.startsWith?.("#") || b.length < 7) return a;
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const ch = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const r = clamp(ch(a, 0) * (1 - t) + ch(b, 0) * t);
  const g = clamp(ch(a, 1) * (1 - t) + ch(b, 1) * t);
  const bl = clamp(ch(a, 2) * (1 - t) + ch(b, 2) * t);
  return "#" + [r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** 相对亮度 0–1（sRGB 近似） */
function luminance(hex) {
  if (!hex?.startsWith?.("#") || hex.length < 7) return 0.2;
  const ch = (i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(1)) + 0.0722 * lin(ch(2));
}

/** 球衣显示色：相对背景强制拉开对比（深衣提亮），保留色相 */
function kitDisplayColor(hex, bgLum = 0.12) {
  let c = hex || "#3d8bfd";
  let lum = luminance(c);
  const minLum = Math.max(0.3, bgLum + 0.24);
  let guard = 0;
  while (lum < minLum && guard < 8) {
    const t = Math.min(0.5, 0.2 + (minLum - lum) * 0.9);
    c = mixHex(c, "#ffffff", t);
    lum = luminance(c);
    guard++;
  }
  if (lum > 0.9) c = mixHex(c, "#cbd5e1", 0.2);
  return c;
}

/** 加权抽取：pairs = [[value, weight], ...]，哈希流稳定 */
function wpick(h, salt, pairs) {
  let total = 0;
  for (const [, w] of pairs) total += w;
  let r = ((h ^ Math.imul(salt + 1, 2654435761)) >>> 0) % Math.max(1, total);
  for (const [v, w] of pairs) {
    if ((r -= w) < 0) return v;
  }
  return pairs[0][0];
}

// ============================================================
// 地区画像：肤色 / 发色 / 发型按国籍合理分配
// ============================================================

/** 肤色 [底色, 阴影]（NES 暖调色阶，浅→深） */
const SKIN_TONES = {
  pale: ["#f6d7b8", "#d9b48f"],
  fair: ["#efc8a0", "#cfa377"],
  light: ["#e6b98e", "#c39468"],
  tan: ["#d4a06a", "#ad7c4b"],
  olive: ["#c08d58", "#9a6c3e"],
  brown: ["#9f6b3f", "#7c4f2b"],
  deep: ["#7c4c2a", "#5e3820"],
  dark: ["#5f3a22", "#452a18"],
};

const HAIR_COLORS = {
  black: "#26221f",
  dkbrown: "#42301f",
  brown: "#5f4128",
  ltbrown: "#7d5731",
  blond: "#c99a45",
  red: "#a84c28",
  grey: "#9aa0a8",
  white: "#dfe3e8",
};

/**
 * 发型 id：
 * 0 平顶(国夫头) 1 飞机头(リーゼント) 2 刺猬 3 寸头 4 侧分
 * 5 锅盖 6 爆炸头 7 短卷 8 光头渐层 9 长发(90s 后蓄)
 */
const STYLE_DEFAULT = [
  [2, 16], [4, 16], [3, 14], [0, 12], [7, 10], [1, 10], [9, 8], [5, 6], [8, 6], [6, 2],
];
const STYLE_EASIA = [
  [5, 20], [4, 18], [2, 18], [1, 14], [3, 12], [0, 10], [9, 5], [7, 3],
];
const STYLE_AFRO = [
  [3, 26], [7, 24], [6, 16], [8, 16], [0, 10], [2, 8],
];

/** 地区画像：skin/hair 为加权表；style 缺省用 STYLE_DEFAULT */
const REGION_PROFILES = {
  nordic: {
    skin: [["pale", 55], ["fair", 30], ["light", 9], ["brown", 3], ["deep", 3]],
    hair: [["blond", 38], ["ltbrown", 25], ["brown", 20], ["red", 9], ["black", 8]],
  },
  brit: {
    skin: [["pale", 38], ["fair", 30], ["light", 13], ["tan", 5], ["brown", 8], ["deep", 6]],
    hair: [["brown", 33], ["dkbrown", 25], ["ltbrown", 14], ["blond", 10], ["red", 12], ["black", 6]],
  },
  weur: {
    skin: [["fair", 36], ["pale", 22], ["light", 17], ["tan", 8], ["brown", 10], ["deep", 7]],
    hair: [["dkbrown", 30], ["brown", 27], ["black", 15], ["blond", 15], ["ltbrown", 9], ["red", 4]],
  },
  fra: {
    skin: [["fair", 28], ["light", 18], ["tan", 12], ["olive", 8], ["brown", 17], ["deep", 13], ["dark", 4]],
    hair: [["black", 34], ["dkbrown", 30], ["brown", 21], ["blond", 8], ["ltbrown", 7]],
  },
  seur: {
    skin: [["light", 30], ["fair", 22], ["tan", 25], ["olive", 15], ["brown", 5], ["deep", 3]],
    hair: [["black", 44], ["dkbrown", 31], ["brown", 18], ["blond", 4], ["ltbrown", 3]],
  },
  eeur: {
    skin: [["pale", 35], ["fair", 35], ["light", 20], ["tan", 6], ["brown", 4]],
    hair: [["brown", 27], ["dkbrown", 25], ["blond", 20], ["ltbrown", 15], ["black", 11], ["red", 2]],
  },
  tur: {
    skin: [["tan", 32], ["olive", 27], ["light", 22], ["fair", 10], ["brown", 9]],
    hair: [["black", 62], ["dkbrown", 28], ["brown", 10]],
  },
  easia: {
    skin: [["light", 38], ["fair", 30], ["tan", 22], ["pale", 10]],
    hair: [["black", 82], ["dkbrown", 15], ["brown", 3]],
    style: STYLE_EASIA,
  },
  wafr: {
    skin: [["deep", 34], ["dark", 30], ["brown", 26], ["tan", 8], ["olive", 2]],
    hair: [["black", 85], ["dkbrown", 15]],
    style: STYLE_AFRO,
  },
  nafr: {
    skin: [["tan", 30], ["olive", 26], ["light", 20], ["brown", 16], ["deep", 6], ["fair", 2]],
    hair: [["black", 70], ["dkbrown", 24], ["brown", 6]],
  },
  latM: {
    skin: [["tan", 22], ["light", 20], ["fair", 12], ["olive", 14], ["brown", 16], ["deep", 12], ["dark", 4]],
    hair: [["black", 50], ["dkbrown", 30], ["brown", 14], ["blond", 4], ["ltbrown", 2]],
  },
  latE: {
    skin: [["fair", 30], ["light", 28], ["tan", 20], ["olive", 10], ["brown", 8], ["deep", 4]],
    hair: [["dkbrown", 32], ["black", 30], ["brown", 22], ["blond", 10], ["ltbrown", 6]],
  },
  mex: {
    skin: [["tan", 32], ["olive", 24], ["brown", 18], ["light", 16], ["fair", 6], ["deep", 4]],
    hair: [["black", 68], ["dkbrown", 24], ["brown", 8]],
  },
  usa: {
    skin: [["fair", 26], ["light", 18], ["pale", 12], ["tan", 10], ["brown", 16], ["deep", 14], ["dark", 4]],
    hair: [["dkbrown", 28], ["brown", 24], ["black", 26], ["blond", 14], ["red", 4], ["ltbrown", 4]],
  },
  aus: {
    skin: [["fair", 34], ["pale", 24], ["light", 18], ["tan", 10], ["brown", 8], ["deep", 6]],
    hair: [["brown", 30], ["dkbrown", 24], ["blond", 22], ["ltbrown", 12], ["black", 8], ["red", 4]],
  },
};

const REGION_OF = {
  ENG: "brit", SCO: "brit", WAL: "brit", IRL: "brit",
  GER: "weur", NED: "weur", BEL: "weur", AUT: "weur", SUI: "weur",
  FRA: "fra",
  ESP: "seur", ITA: "seur", POR: "seur", CRO: "seur", SRB: "seur",
  POL: "eeur", UKR: "eeur",
  DEN: "nordic", SWE: "nordic", NOR: "nordic",
  TUR: "tur",
  JPN: "easia", KOR: "easia", CHN: "easia",
  NGA: "wafr", SEN: "wafr", GHA: "wafr", CIV: "wafr",
  MAR: "nafr",
  BRA: "latM", COL: "latM",
  ARG: "latE", URU: "latE",
  MEX: "mex",
  USA: "usa",
  AUS: "aus",
};

/** 由国籍 + 哈希得到稳定的外貌：{ skin, skinShade, hairHex, styleId } */
function lookFor(h, nation, age = 25) {
  const prof = REGION_PROFILES[REGION_OF[nation] || ""] || REGION_PROFILES.weur;
  const skinKey = wpick(h, 11, prof.skin);
  const [skin, skinShade] = SKIN_TONES[skinKey];
  // 深肤色 → 黑/深棕发（自然合理）；发型偏向短寸/短卷/爆炸头
  const darkSkin = skinKey === "deep" || skinKey === "dark";
  const hairKey = darkSkin
    ? wpick(h, 12, [["black", 80], ["dkbrown", 20]])
    : wpick(h, 12, prof.hair);
  let hairHex = HAIR_COLORS[hairKey];
  // 年龄灰白
  if (age >= 40) {
    hairHex = wpick(h, 13, [[HAIR_COLORS.grey, 55], [HAIR_COLORS.white, 25], [mixHex(hairHex, HAIR_COLORS.grey, 0.6), 20]]);
  } else if (age >= 34 && (h & 3) === 0) {
    hairHex = mixHex(hairHex, HAIR_COLORS.grey, 0.45);
  }
  const styleW = darkSkin ? STYLE_AFRO : prof.style || STYLE_DEFAULT;
  const styleId = wpick(h, 14, styleW);
  return { skin, skinShade, hairHex, styleId, darkSkin };
}

// ============================================================
// 像素绘制：16×16 网格，cell=3，viewBox 48×48
// ============================================================

const CELL = 3;
const OUT = "#1b1613"; // 全局粗描边（热血式近黑）
const EYE = "#1e1a17";
const EYEWHITE = "#f4efe4";
const MOUTH = "#7e3a30";

/** 单格像素 */
function P(x, y, c) {
  return `<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}" fill="${c}"/>`;
}
/** 横向一段 [x0..x1] */
function R(x0, x1, y, c) {
  return `<rect x="${x0 * CELL}" y="${y * CELL}" width="${(x1 - x0 + 1) * CELL}" height="${CELL}" fill="${c}"/>`;
}
/** 竖向一段 [y0..y1] */
function C(x, y0, y1, c) {
  return `<rect x="${x * CELL}" y="${y0 * CELL}" width="${CELL}" height="${(y1 - y0 + 1) * CELL}" fill="${c}"/>`;
}

/** 心情背景：双色 2×2 格拼色（复古抖动） */
const MOOD_BG = {
  neutral: ["#4d5a74", "#465269"],
  happy: ["#4d6e5c", "#456354"],
  injured: ["#6e4d55", "#63454c"],
  tired: ["#4d5f74", "#455669"],
  sad: ["#565d6b", "#4d5461"],
};

function bgChecker(mood) {
  const [a, b] = MOOD_BG[mood] || MOOD_BG.neutral;
  const parts = [`<rect width="48" height="48" fill="${a}"/>`];
  // 4×4 cell 的棋盘块（12px），复古但不噪
  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      if ((bx + by) % 2 === 1) {
        parts.push(`<rect x="${bx * 12}" y="${by * 12}" width="12" height="12" fill="${b}"/>`);
      }
    }
  }
  return parts.join("");
}

/**
 * 发型（覆盖在脸之上）。每款返回像素串。
 * H=发色 Hh=高光 S=肤色（发际线用）
 */
function hairPixels(styleId, H, Hh, S) {
  switch (styleId) {
    case 0: // 平顶（国夫头）：方正平头 + 鬓角
      return [
        R(3, 12, 0, OUT), R(3, 12, 1, H), R(3, 12, 2, H), R(3, 12, 3, H),
        R(4, 6, 1, Hh),
        P(3, 4, H), P(12, 4, H), P(4, 4, H), P(11, 4, H),
      ].join("");
    case 1: // 飞机头（リーゼント）：前冲油头
      return [
        R(8, 12, 0, OUT), P(13, 1, OUT),
        R(8, 12, 1, H), P(13, 2, H),
        R(3, 12, 2, H), R(3, 12, 3, H), P(3, 1, OUT), R(4, 7, 1, OUT),
        R(9, 11, 1, Hh), P(12, 2, Hh),
        P(3, 4, H), P(12, 4, H),
      ].join("");
    case 2: // 刺猬头：锯齿尖
      return [
        P(3, 1, H), P(5, 1, H), P(7, 1, H), P(9, 1, H), P(11, 1, H),
        P(4, 0, OUT), P(8, 0, OUT), P(12, 1, OUT),
        R(3, 12, 2, H), R(3, 12, 3, H),
        P(5, 2, Hh), P(8, 2, Hh),
        P(3, 4, H), P(12, 4, H),
      ].join("");
    case 3: { // 寸头：贴头皮
      const buzz = mixHex(H, S, 0.3);
      return [
        R(4, 11, 1, OUT), R(3, 12, 2, buzz), R(3, 12, 3, buzz),
        P(3, 3, OUT), P(12, 3, OUT),
      ].join("");
    }
    case 4: // 侧分：右侧分缝，刘海扫左
      return [
        R(4, 11, 0, OUT), R(3, 12, 1, H), R(3, 9, 2, H), P(11, 2, H), P(12, 2, H),
        R(3, 7, 3, H),
        R(4, 6, 1, Hh),
        P(3, 4, H), P(12, 3, H), P(12, 4, H),
      ].join("");
    case 5: // 锅盖头：厚齐刘海盖到眉上
      return [
        R(4, 11, 0, OUT), R(3, 12, 1, H), R(3, 12, 2, H), R(3, 12, 3, H),
        R(3, 4, 4, H), R(11, 12, 4, H),
        R(4, 7, 1, Hh),
        P(3, 5, H), P(12, 5, H),
      ].join("");
    case 6: // 爆炸头：大圆蓬
      return [
        R(4, 11, 0, H), R(2, 13, 1, H), R(2, 13, 2, H), R(2, 13, 3, H),
        C(2, 4, 5, H), C(13, 4, 5, H),
        P(5, 1, Hh), P(9, 2, Hh), P(12, 1, Hh), P(3, 3, Hh),
      ].join("");
    case 7: // 短卷：顶部波浪
      return [
        P(4, 1, H), P(5, 1, H), P(7, 1, H), P(8, 1, H), P(10, 1, H), P(11, 1, H),
        R(3, 12, 2, H), R(3, 12, 3, H),
        P(5, 2, Hh), P(9, 2, Hh), P(12, 2, Hh),
        P(3, 4, H), P(12, 4, H),
      ].join("");
    case 8: { // 光头渐层：只留两鬓
      const fade = mixHex(H, S, 0.45);
      return [
        R(4, 11, 2, OUT), C(3, 3, 5, fade), C(12, 3, 5, fade),
        P(6, 2, mixHex(S, "#ffffff", 0.3)), P(7, 2, mixHex(S, "#ffffff", 0.3)),
      ].join("");
    }
    case 9: // 90s 长发：顶厚 + 两侧垂到颚
      return [
        R(4, 11, 0, OUT), R(3, 12, 1, H), R(3, 12, 2, H), R(3, 12, 3, H),
        C(2, 3, 8, H), C(13, 3, 8, H), P(2, 9, OUT), P(13, 9, OUT),
        R(4, 6, 1, Hh),
      ].join("");
    default:
      return R(3, 12, 2, "#26221f");
  }
}

/** 眉+眼+嘴（心情决定）；锅盖头(5)刘海压到眉线，一律用平眉防穿模 */
function facePixels(mood, look, styleId) {
  const browColor = mixHex(look.hairHex, OUT, look.darkSkin ? 0.3 : 0.55);
  const flatOnly = styleId === 5;
  const parts = [];

  // —— 眉毛 ——
  if (flatOnly || mood === "happy" || mood === "tired") {
    // 平眉
    parts.push(P(4, 5, browColor), P(5, 5, browColor));
    parts.push(P(10, 5, browColor), P(11, 5, browColor));
  } else if (mood === "sad") {
    // 垂眉（外低内高）
    parts.push(P(6, 4, browColor), P(5, 5, browColor), P(4, 5, browColor));
    parts.push(P(9, 4, browColor), P(10, 5, browColor), P(11, 5, browColor));
  } else {
    // 热血怒眉（外高内低，neutral / injured 默认）
    parts.push(P(4, 4, browColor), P(5, 4, browColor), P(6, 5, browColor));
    parts.push(P(11, 4, browColor), P(10, 4, browColor), P(9, 5, browColor));
  }

  // —— 眼睛 ——
  if (mood === "injured") {
    // 左眼闭合「—」+ 右眼正常 + 淤青
    parts.push(P(5, 6, EYE), P(6, 6, EYE));
    parts.push(P(9, 6, EYEWHITE), P(10, 6, EYEWHITE), P(9, 6, EYE));
    parts.push(P(10, 7, "#a15b50"));
  } else if (mood === "tired") {
    // 半睁「——」+ 汗滴
    parts.push(P(5, 6, EYE), P(6, 6, EYE), P(9, 6, EYE), P(10, 6, EYE));
    parts.push(P(12, 4, "#8fd7f2"), P(12, 5, "#5db6dc"));
  } else {
    parts.push(P(5, 6, EYEWHITE), P(6, 6, EYE), P(9, 6, EYE), P(10, 6, EYEWHITE));
  }

  // —— 鼻 ——
  parts.push(P(7, 7, look.skinShade));

  // —— 嘴 ——
  if (mood === "happy") {
    // 热血咧嘴大笑：黑框白牙
    parts.push(R(5, 10, 8, OUT), R(6, 9, 8, "#fdf6ea"), R(6, 9, 9, OUT));
    parts.push(P(4, 7, "#d98a6a"), P(11, 7, "#d98a6a")); // 脸红
  } else if (mood === "sad" || mood === "injured") {
    // 撇嘴
    parts.push(P(7, 8, MOUTH), P(8, 8, MOUTH), P(6, 9, MOUTH), P(9, 9, MOUTH));
  } else {
    // 抿嘴硬汉线
    parts.push(P(7, 8, MOUTH), P(8, 8, MOUTH), P(9, 8, MOUTH));
  }

  // —— 受伤绷带（缠头）——
  if (mood === "injured") {
    parts.push(R(4, 11, 2, "#e8e4da"), P(3, 3, "#e8e4da"), P(12, 2, "#d4cfc2"));
  }
  return parts.join("");
}

/** 头部底盘：描边 + 脸 + 耳 + 下颚阴影（发型另画） */
function headPixels(look) {
  const S = look.skin;
  const Sd = look.skinShade;
  return [
    // 描边圈
    R(4, 11, 2, OUT),
    C(3, 3, 9, OUT), C(12, 3, 9, OUT),
    R(4, 5, 10, OUT), R(10, 11, 10, OUT),
    // 脸
    R(4, 11, 3, S), R(4, 11, 4, S), R(4, 11, 5, S), R(4, 11, 6, S),
    R(4, 11, 7, S), R(4, 11, 8, S), R(4, 11, 9, S),
    // 耳
    P(3, 6, S), P(12, 6, S),
    // 下颚阴影
    P(4, 9, Sd), P(11, 9, Sd),
  ].join("");
}

/** 球衣躯干（球员）：垫肩斜线 + 队色 + 插肩袖副色 + GK 横带 */
function jerseyPixels(kitP, kitS, pos) {
  const collar = mixHex(kitS, "#ffffff", 0.25);
  const parts = [
    // 颈
    R(6, 9, 10, "__NECK__"),
    // 肩线描边
    R(2, 5, 11, OUT), R(10, 13, 11, OUT), P(1, 12, OUT), P(14, 12, OUT),
    // 领口
    R(6, 9, 11, collar),
    // 躯干
    R(1, 14, 12, kitP), R(1, 14, 13, kitP), R(1, 14, 14, kitP), R(1, 14, 15, kitP),
    // 插肩袖（副色）
    C(1, 12, 15, kitS), C(2, 12, 15, kitS), C(13, 12, 15, kitS), C(14, 12, 15, kitS),
    P(3, 12, kitS), P(12, 12, kitS),
    // 胸口小 V
    P(7, 12, kitS), P(8, 12, kitS),
  ];
  if (pos === "GK") {
    parts.push(R(4, 11, 14, mixHex(kitP, "#ffffff", 0.5)));
  }
  return parts.join("");
}

/** 职员躯干：西装 / 风衣 / 白大褂 */
function staffTorso(role, tieColor) {
  const neck = "__NECK__";
  if (role === "doctor") {
    return [
      R(6, 9, 10, neck),
      R(2, 5, 11, OUT), R(10, 13, 11, OUT), P(1, 12, OUT), P(14, 12, OUT),
      R(1, 14, 12, "#eef2f6"), R(1, 14, 13, "#eef2f6"), R(1, 14, 14, "#eef2f6"), R(1, 14, 15, "#eef2f6"),
      C(7, 11, 15, "#d7dde5"), C(8, 11, 15, "#d7dde5"),
      P(7, 13, "#d84343"), P(8, 13, "#d84343"), P(7, 14, "#d84343"), P(8, 14, "#d84343"),
    ].join("");
  }
  if (role === "scout") {
    return [
      R(6, 9, 10, neck),
      R(2, 5, 11, OUT), R(10, 13, 11, OUT), P(1, 12, OUT), P(14, 12, OUT),
      R(1, 14, 12, "#57503c"), R(1, 14, 13, "#57503c"), R(1, 14, 14, "#57503c"), R(1, 14, 15, "#57503c"),
      R(6, 9, 11, "#6b6350"), P(7, 13, "#403a2c"), P(8, 13, "#403a2c"),
      C(4, 12, 15, "#4a4433"), C(11, 12, 15, "#4a4433"),
    ].join("");
  }
  // coach / manager：深西装 + 白衬衫 + 领带
  return [
    R(6, 9, 10, neck),
    R(2, 5, 11, OUT), R(10, 13, 11, OUT), P(1, 12, OUT), P(14, 12, OUT),
    R(1, 14, 12, "#2a3442"), R(1, 14, 13, "#2a3442"), R(1, 14, 14, "#2a3442"), R(1, 14, 15, "#2a3442"),
    R(6, 9, 11, "#e8ecf2"), P(6, 12, "#e8ecf2"), P(9, 12, "#e8ecf2"),
    P(7, 12, tieColor), P(8, 12, tieColor), P(7, 13, tieColor), P(8, 13, tieColor), P(7, 14, shiftHex(tieColor, -24)), P(8, 14, shiftHex(tieColor, -24)),
  ].join("");
}

/** 球探鸭舌帽（盖掉发型顶部） */
function scoutCap() {
  return [
    R(4, 11, 0, OUT), R(3, 12, 1, "#6b6350"), R(3, 12, 2, "#6b6350"),
    R(3, 13, 3, "#57503c"), P(13, 3, "#4a4433"), P(12, 3, "#4a4433"),
    R(4, 7, 1, "#7d755f"),
  ].join("");
}

// ============================================================
// 组装
// ============================================================

/**
 * 渲染像素头像 SVG（热血风）
 * @param {object} opts
 * @param {AvatarMood} [opts.mood]
 * @param {string} [opts.nation] 国籍 code（决定肤色/发色/发型分布）
 */
export function renderAvatarSvg(opts = {}) {
  const seed = opts.seed || opts.id || opts.name || "anon";
  const h = hashStr(seed);
  const size = opts.size || 36;
  const role = opts.role || "player";
  const pos = opts.pos || "";
  const age = opts.age || 25;
  const mood = opts.mood || "neutral";
  const nation = opts.nation || null;

  const look = lookFor(h, nation, age);

  const bgLum = luminance(MOOD_BG[mood]?.[0] || MOOD_BG.neutral[0]);
  const kitP = kitDisplayColor(opts.kitPrimary || "#3d8bfd", bgLum);
  let kitS = opts.kitSecondary || shiftHex(kitP, -42);
  {
    // 副色与主色太近时强制拉开
    const pr = parseInt(kitP.slice(1, 3), 16) || 0;
    const pg = parseInt(kitP.slice(3, 5), 16) || 0;
    const pb = parseInt(kitP.slice(5, 7), 16) || 0;
    const sr = parseInt(String(kitS).slice(1, 3), 16) || 0;
    const sg = parseInt(String(kitS).slice(3, 5), 16) || 0;
    const sb = parseInt(String(kitS).slice(5, 7), 16) || 0;
    if (Math.hypot(pr - sr, pg - sg, pb - sb) < 70) {
      const lum = 0.299 * pr + 0.587 * pg + 0.114 * pb;
      kitS = lum > 140 ? mixHex(kitP, "#0f172a", 0.55) : mixHex(kitP, "#f8fafc", 0.45);
    }
  }

  const Hh = shiftHex(look.hairHex, 30);
  const isStaff = role !== "player";

  const torso = isStaff
    ? staffTorso(role, role === "manager" ? "#3d8bfd" : "#b0433a").replaceAll("__NECK__", look.skin)
    : jerseyPixels(kitP, kitS, pos).replaceAll("__NECK__", look.skin);

  // 球探帽盖发型；其余画发型
  const hairLayer =
    role === "scout" ? scoutCap() : hairPixels(look.styleId, look.hairHex, Hh, look.skin);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" class="avatar-svg avatar-pixel" shape-rendering="crispEdges" data-mood="${mood}" aria-hidden="true">
  ${bgChecker(mood)}
  ${headPixels(look)}
  ${hairLayer}
  ${facePixels(mood, look, look.styleId)}
  ${torso}
</svg>`;
  return svg.replace("<svg ", `<svg data-ini="${escapeAttr(initials(opts.name))}" `);
}

/**
 * 根据球员状态推断表情（优先级：伤 > 低士气 > 高士气开心 > 低体能疲惫 > 默认）
 * @returns {AvatarMood}
 */
export function moodFromPlayer(player) {
  if (!player) return "neutral";
  if ((player.injured || 0) > 0) return "injured";
  const morale = player.morale ?? 70;
  const fitness = player.fitness ?? 80;
  if (morale <= 40) return "sad";
  if (morale >= 82) return "happy";
  if (fitness <= 50) return "tired";
  if (fitness <= 62 && morale < 60) return "tired";
  return "neutral";
}

export function avatarHtml(person, opts = {}) {
  if (!person) return "";
  const role = opts.role || person.role || (person.pos ? "player" : "manager");
  const size = opts.size || 36;
  const kitPrimary = opts.kitPrimary || opts.kit?.primary;
  const kitSecondary = opts.kitSecondary || opts.kit?.secondary;
  let mood = opts.mood;
  if (!mood && role === "player") mood = moodFromPlayer(person);
  if (!mood) mood = "neutral";

  const svg = renderAvatarSvg({
    seed: person.id || person.name,
    name: person.name,
    role,
    pos: person.pos,
    age: person.age,
    nation: person.nationality || null,
    kitPrimary,
    kitSecondary,
    size,
    mood,
  });
  const moodTip =
    mood === "injured"
      ? " · 受伤"
      : mood === "happy"
        ? " · 状态佳"
        : mood === "sad"
          ? " · 士气低"
          : mood === "tired"
            ? " · 疲惫"
            : "";
  const cls = `avatar mood-${mood}${opts.className ? " " + opts.className : ""}`;
  return `<span class="${cls}" style="width:${size}px;height:${size}px" title="${escapeAttr(
    (person.name || "") + moodTip
  )}">${svg}</span>`;
}

function escapeAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** 主题队固定配色（与 models.ensureKit 同步；avatar 不 import models 以免环依赖） */
const AVATAR_KIT_THEME = {
  sunset: { primary: "#f97316", secondary: "#5b21b6" },
  harbor: { primary: "#0ea5e9", secondary: "#f8fafc" },
  steel: { primary: "#64748b", secondary: "#dc2626" },
  mill: { primary: "#166534", secondary: "#eab308" },
};

/** 球员 + 俱乐部球衣色 + 状态表情 */
export function playerAvatarHtml(player, club, size = 36) {
  const theme = club?.id ? AVATAR_KIT_THEME[club.id] : null;
  // 主题队优先；否则用 kit / color（调用方应 ensureKit，这里再兜一层）
  const kitPrimary = theme?.primary || club?.kit?.primary || club?.color || "#3d8bfd";
  const kitSecondary =
    theme?.secondary || club?.kit?.secondary || club?.kit?.secondaryColor || null;
  return avatarHtml(player, {
    role: "player",
    size,
    kitPrimary,
    kitSecondary,
    mood: moodFromPlayer(player),
  });
}

export function staffAvatarHtml(staff, size = 48) {
  return avatarHtml(staff, {
    role: staff?.role || "coach",
    size,
    mood: "neutral",
  });
}
