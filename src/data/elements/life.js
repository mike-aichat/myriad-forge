import { make } from "./_helpers.js";

const e = make("life");

export default [
  e("soup", "原始汤", ["mud", "lightning"], "一锅还没决定要变成什么的化学粥。", "pool", "soup", "bubble"),
  e("organic", "有机分子", ["soup", "lightning"], "原子们第一次牵手，场面有点混乱。", "orb", "organic", "chain"),
  e("cell", "细胞", ["organic", "water"], "物质搭起的第一间单间公寓，带一层墙。", "orb", "cell", "dot"),
  e("microbe", "微生物", ["soup", "water"], "一个看不见的房客，却总在改写整栋楼。", "microbe", "microbe"),
  e("plankton", "浮游生物", ["microbe", "sea"], "海面下最庞大的流浪民族，个头只有一个句号那么大。", "microbe", "plankton", "speck"),
  e("life", "生命", ["cell", "light"], "一堆本可以散掉的原子，突然决定互相等一等。", "orb", "life", "ring"),
  e("gene", "基因", ["cell", "writing"], "生命写给下一代的密信，用的是四个字母。", "helix", "gene"),
  e("virus", "病毒", ["microbe", "dark"], "一段迷路的密码，撞见谁就借谁的房间。", "microbe", "virus", "spikes"),
];
