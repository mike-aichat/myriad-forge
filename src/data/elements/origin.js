import { make } from "./_helpers.js";

const e = make("origin");

export default [
  e("fire", "火", null, "它先学会了跳舞，然后才学会燃烧。", "flame", "fire", "spark"),
  e("water", "水", null, "世界上最好的形状，是它愿意待着的那个。", "droplet", "water"),
  e("earth", "土", null, "沉默的收藏家，口袋里装着种子、骨头和没说完的话。", "rock", "earth"),
  e("air", "风", null, "没有人见过它，但每个人都听过它的谣言。", "wind", "air"),
  e("light", "光", null, "被叫出名字的第一束光。它把石头照得有点不好意思。", "orb", "light", "halo"),
  e("dark", "暗", null, "光走后留下的房间。角落里偶尔传来咀嚼声。", "orb", "dark", "speck"),
];
