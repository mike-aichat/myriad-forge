export const CATEGORIES = [
  {
    id: "origin",
    name: "源初",
    color: "#e7a660",
    note: "世界尚未命名时，先有了这几种脾气。",
  },
  {
    id: "nature",
    name: "天象",
    color: "#6cb8a3",
    note: "风、水与火在大地上留下的临时笔迹。",
  },
  {
    id: "mineral",
    name: "矿物",
    color: "#c4b280",
    note: "时间压紧后的沉默，偶尔会反光。",
  },
  {
    id: "life",
    name: "生灵",
    color: "#84c08a",
    note: "物质第一次决定不再只是物质。",
  },
  {
    id: "plant",
    name: "植物",
    color: "#8fbf67",
    note: "向光生长，顺便把世界染绿。",
  },
  {
    id: "animal",
    name: "动物",
    color: "#d68a60",
    note: "会走路的欲望，长着牙齿和好奇心。",
  },
  {
    id: "human",
    name: "人间",
    color: "#d9705c",
    note: "火堆旁的闲谈，后来变成了文明。",
  },
  {
    id: "craft",
    name: "造物",
    color: "#95a3bd",
    note: "把石头、木头和念头拼成可以用的东西。",
  },
  {
    id: "tech",
    name: "科技",
    color: "#5fb7d4",
    note: "闪电学会听从命令之后的事。",
  },
  {
    id: "arcane",
    name: "秘法",
    color: "#b58ad4",
    note: "世界规则上的后门，以及住在门后的事物。",
  },
  {
    id: "cosmos",
    name: "星海",
    color: "#7e9ee8",
    note: "大到让人忘记自己也在其中的那些东西。",
  },
  {
    id: "concept",
    name: "哲理",
    color: "#e0d4b4",
    note: "看不见，但每个决定都要经过它们。",
  },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((category) => [category.id, category]));
