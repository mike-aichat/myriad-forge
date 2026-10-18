export const CHAPTERS = [
  {
    id: "prologue",
    order: 0,
    numeral: "序",
    title: "空白之书",
    subtitle: "四个名字在掌心发烫",
    intro:
      "你在一张没有字的书页上醒来。火、水、土、风在掌心留下四种温度。它们不解释，靠得很近，等你把手合拢。",
    outro:
      "第一页出现了。墨迹还湿着，远处传来一声轻响，像有什么东西第一次学会呼吸。",
    objectives: [
      { target: "steam", prompt: "让火与水互相试探" },
      { target: "smoke", prompt: "让火在风里留下笔迹" },
      { target: "mud", prompt: "让水学会和土相处" },
    ],
    reward: { insight: 2, unlock: [] },
  },
  {
    id: "stone-and-sea",
    order: 1,
    numeral: "一",
    title: "石头与海",
    subtitle: "世界有了可以站立的地方",
    intro:
      "火冷却下来，土沉下去，海第一次有了岸。你还不知道什么叫重量，但已经听见石头落在世界底部的回声。",
    outro:
      "你从石头里擦出一束光。它没有温度，却照亮了所有还没有名字的东西。光说：继续。",
    objectives: [
      { target: "stone", prompt: "让岩浆学会安静" },
      { target: "glass", prompt: "让沙在火里忘记自己的形状" },
      { target: "ice", prompt: "让雨在风里停住脚步" },
      { target: "salt", prompt: "逼海交出它藏起来的实话" },
    ],
    reward: { insight: 2, unlock: ["light"] },
  },
  {
    id: "first-breath",
    order: 2,
    numeral: "二",
    title: "第一次呼吸",
    subtitle: "泥里冒出细小的气泡",
    intro:
      "光落进浅浅的水洼。泥开始发热，气泡从深处浮上来，像一串不会说话的标点。世界正试着添一种新麻烦。",
    outro:
      "世界第一次感到痒。那是生命在挠它的掌心。你没有把它擦掉，反而俯下身，听见了心跳。",
    objectives: [
      { target: "microbe", prompt: "让原始汤里出现看不见的房客" },
      { target: "life", prompt: "让一堆原子决定互相等一等" },
      { target: "grass", prompt: "让大地长出第一层绿色" },
      { target: "fish", prompt: "让水拥有自己的居民" },
      { target: "bird", prompt: "让蜥蜴想起天空" },
    ],
    reward: { insight: 3, unlock: [] },
  },
  {
    id: "campfire",
    order: 3,
    numeral: "三",
    title: "文明的篝火",
    subtitle: "有些兽站起来，开始问太多问题",
    intro:
      "有一种毛茸茸的野兽学会了抬头。它看看火，又看看自己的手，问题一个接一个冒出来。世界要开始吵了。",
    outro:
      "城市亮起灯，影子也变长了。暗从光的背后醒来，向你递来另一半世界。它说：光有多亮，得问我。",
    objectives: [
      { target: "writing", prompt: "让话离开说话的人" },
      { target: "village", prompt: "让火堆旁聚起第一间屋" },
      { target: "city", prompt: "让房屋挤成一片会发光的森林" },
      { target: "king", prompt: "让一个人坐在众人目光搭成的椅子上" },
    ],
    reward: { insight: 3, unlock: ["dark"] },
  },
  {
    id: "steam-and-spark",
    order: 4,
    numeral: "四",
    title: "蒸汽与电",
    subtitle: "把火关进铁里，让闪电走线",
    intro:
      "人类嫌借火不够用了。他们把火关进铁罐，把闪电引进铜线，逼世界回答更蛮横的问题。",
    outro:
      "机器开始做梦。梦里没有蒸汽，堆着没完没了的信息，还有一个越来越像人的影子。",
    objectives: [
      { target: "steamengine", prompt: "让蒸汽在铁罐里发脾气" },
      { target: "electricity", prompt: "让闪电学会走直线" },
      { target: "lightbulb", prompt: "给夜晚装一个开关" },
      { target: "computer", prompt: "让硅学会计算自己的电费" },
      { target: "internet", prompt: "让电脑们牵起手" },
    ],
    reward: { insight: 3, unlock: [] },
  },
  {
    id: "ask-the-stars",
    order: 5,
    numeral: "五",
    title: "向星海发问",
    subtitle: "抬头已经不够了",
    intro:
      "他们造出更大的眼睛，又把眼睛送上天空。星海不说话，但沉默里有能测出来的距离。",
    outro:
      "星海没回答，把更深的黑暗挪开了一点。你看见时间的边缘，时间正朝你流过来。",
    objectives: [
      { target: "telescope", prompt: "把远方拉到眼前" },
      { target: "rocket", prompt: "给火药一个向上的用处" },
      { target: "satellite", prompt: "把一块铁留在天上替世界记路" },
      { target: "spacestation", prompt: "在星星中间搭一间活动板房" },
      { target: "timemachine", prompt: "给时间装一个回车键" },
    ],
    reward: { insight: 4, unlock: [] },
  },
  {
    id: "all-things",
    order: 6,
    numeral: "终",
    title: "万物归一",
    subtitle: "把最后五个答案放进同一句话",
    intro:
      "书页只剩最后一页。生命、时间、王冠、世界与神谕在纸的边缘排成一列。它们不催你，等一个足够大的句子。",
    outro:
      "你合上书。世界没有结束。它现在会介绍自己了。炉火暗下去，你第一次听见宇宙的呼吸。",
    objectives: [
      { target: "lifetree", prompt: "让生命长成一棵可以遮住时间的树" },
      { target: "riveroftime", prompt: "让时间不再滴答，改为流动" },
      { target: "crownofstars", prompt: "给夜晚找一个正统继承人" },
      { target: "worldcore", prompt: "把世界削到只剩一颗果核" },
      { target: "oracleheart", prompt: "让一颗心替神记住所有答案" },
      { target: "allinone", prompt: "把所有问题收进同一句话" },
    ],
    reward: { insight: 0, unlock: [] },
    ending: true,
  },
];

export const FINAL_CHAPTER_ID = "all-things";

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((chapter) => [chapter.id, chapter]));
