/**
 * 生成三级联赛各 20 队（共 60 队）
 * 开局仅 division === 3 可选
 */

const COLORS = [
  "#3d8bfd", "#3dd68c", "#e6b450", "#f07178", "#a78bfa", "#f472b6",
  "#38bdf8", "#a3e635", "#22d3ee", "#4ade80", "#fb923c", "#60a5fa",
  "#c084fc", "#2dd4bf", "#fb7185", "#818cf8", "#94a3b8", "#64748b",
  "#84cc16", "#0ea5e9", "#a8a29e", "#65a30d", "#d97706", "#e11d48",
];

/**
 * 部分俱乐部固定队服主题（id → 配色）
 * 避免主题队被随机成灰蓝，和中性头像背景糊在一起
 *
 * 队名风格：虚构英式联赛（United / City / Athletic / Rovers / Town / Borough…）
 * 灵感来自英超/英冠/英甲命名习惯，但均为原创，避免真实俱乐部商标。
 */
export const CLUB_KIT_THEMES = {
  // Westend Town：亮橙 + 暮紫斜带
  sunset: {
    primary: "#f97316",
    secondary: "#5b21b6",
    style: "sash",
    numberColor: "#ffffff",
  },
  // Harbourgate：海蓝 + 白竖条
  harbor: {
    primary: "#0ea5e9",
    secondary: "#f8fafc",
    style: "stripes",
    numberColor: "#0f172a",
  },
  // Steelborough：钢灰 + 赤红对半
  steel: {
    primary: "#64748b",
    secondary: "#dc2626",
    style: "halves",
    numberColor: "#ffffff",
  },
  // Millford United：深绿 + 金横条
  mill: {
    primary: "#166534",
    secondary: "#eab308",
    style: "hoops",
    numberColor: "#ffffff",
  },
};

/** 超联 20 — 顶级都会 / 豪门气质（英超量级虚构名） */
const D1 = [
  ["vcc", "Vanguard City", "Vanguard", 82, 55_000_000],
  ["harbor", "Harbourgate Athletic", "Harbour", 80, 48_000_000],
  ["north", "Northbridge United", "Northbridge", 79, 42_000_000],
  ["river", "Riverside Rovers", "Riverside", 78, 38_000_000],
  ["steel", "Steelborough FC", "Steelboro", 77, 35_000_000],
  ["capital", "Capital Borough", "Capital", 76, 33_000_000],
  ["royal", "Royal Crest Athletic", "Crest", 75, 30_000_000],
  ["metro", "Metrovale FC", "Metrovale", 74, 28_000_000],
  ["crown", "Crownfield United", "Crownfield", 74, 27_000_000],
  ["atlas", "Atlas Park", "Atlas", 73, 26_000_000],
  ["nova", "Novabridge FC", "Novabridge", 73, 25_000_000],
  ["olympic", "Olympia Town", "Olympia", 72, 24_000_000],
  ["titan", "Titanford United", "Titanford", 72, 23_000_000],
  ["horizon", "Horizon Athletic", "Horizon", 71, 22_000_000],
  ["empire", "Empire Lane", "Empire", 71, 21_000_000],
  ["summit", "Summit United", "Summit", 70, 20_000_000],
  ["legend", "Legendale FC", "Legendale", 70, 19_500_000],
  ["prime", "Primrose City", "Primrose", 69, 19_000_000],
  ["galaxy", "Galeway United", "Galeway", 69, 18_500_000],
  ["zenith", "Zenith Borough", "Zenith", 68, 18_000_000],
];

/** 甲级 20 — 中游工业城 / 海滨镇气质（英冠量级虚构名） */
const D2 = [
  ["eagle", "Eaglecliff United", "Eaglecliff", 67, 14_000_000],
  ["forest", "Greenwood Rovers", "Greenwood", 66, 13_000_000],
  ["lion", "Lionsgate Athletic", "Lionsgate", 65, 12_000_000],
  ["wave", "Tideswell FC", "Tideswell", 65, 11_500_000],
  ["canyon", "Canyondale Town", "Canyondale", 64, 11_000_000],
  ["harbor2", "Southharbour FC", "S.Harbour", 64, 10_500_000],
  ["phoenix", "Phoenixford", "Phoenixford", 63, 10_000_000],
  ["aurora", "Aurorafield", "Aurora", 63, 9_500_000],
  ["raven", "Raventhorpe", "Raven", 62, 9_000_000],
  ["iron", "Ironbridge Athletic", "Ironbridge", 62, 8_800_000],
  ["storm", "Stormhaven FC", "Stormhaven", 61, 8_500_000],
  ["delta", "Deltamouth United", "Deltamouth", 61, 8_200_000],
  ["beacon", "Beacon Hill", "Beacon", 60, 8_000_000],
  ["falcon", "Falconridge", "Falcon", 60, 7_800_000],
  ["ridge", "Ridgeway Rovers", "Ridgeway", 59, 7_500_000],
  ["coral", "Coral Bay FC", "Coral Bay", 59, 7_200_000],
  ["pioneer", "Pioneer Athletic", "Pioneer", 58, 7_000_000],
  ["comet", "Cometbury Town", "Cometbury", 58, 6_800_000],
  ["bastion", "Bastion United", "Bastion", 57, 6_500_000],
  ["mirage", "Mirage Town", "Mirage", 57, 6_200_000],
];

/** 乙级 20（开局可选）— 小镇 / 码头 / 矿区气质（英甲量级虚构名） */
const D3 = [
  ["sunset", "Westend Town", "Westend", 55, 3_800_000],
  ["mill", "Millford United", "Millford", 54, 3_500_000],
  ["dock", "Dockside Athletic", "Dockside", 54, 3_300_000],
  ["valley", "Valleyford FC", "Valleyford", 53, 3_100_000],
  ["bridge", "Longbridge Rovers", "Longbridge", 53, 3_000_000],
  ["mines", "Miners United", "Miners", 52, 2_800_000],
  ["farm", "Farmstead FC", "Farmstead", 52, 2_600_000],
  ["village", "Village Green", "V.Green", 51, 2_500_000],
  ["harbor3", "Westbay United", "Westbay", 51, 2_400_000],
  ["chapel", "Chapelgate", "Chapelgate", 50, 2_300_000],
  ["quarry", "Quarrytown FC", "Quarrytown", 50, 2_200_000],
  ["meadow", "Meadowbank", "Meadowbank", 49, 2_100_000],
  ["lantern", "Lantern Borough", "Lantern", 49, 2_000_000],
  ["ferry", "Ferrybridge Athletic", "Ferrybridge", 48, 1_900_000],
  ["orchard", "Orchard United", "Orchard", 48, 1_850_000],
  ["slate", "Slateford Town", "Slateford", 47, 1_800_000],
  ["willow", "Willowdale FC", "Willowdale", 47, 1_750_000],
  ["brook", "Brookside Athletic", "Brookside", 46, 1_700_000],
  ["anchor", "Anchorage FC", "Anchorage", 46, 1_650_000],
  ["hearth", "Hearthfield Town", "Hearthfield", 45, 1_600_000],
];

function pack(list, division) {
  return list.map((row, i) => {
    const [id, name, short, power, money] = row;
    const theme = CLUB_KIT_THEMES[id];
    return {
      id,
      name,
      short,
      power,
      money,
      color: theme?.primary || COLORS[i % COLORS.length],
      division,
    };
  });
}

export const CLUB_TEMPLATES = [
  ...pack(D1, 1),
  ...pack(D2, 2),
  ...pack(D3, 3),
];
