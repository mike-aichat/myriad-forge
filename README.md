# 万象熔炉 · Myriad Forge

一款向《Little Alchemy》与《Doodle God》致敬的中文要素合成游戏。界面像一座漂浮在深空里的炼金观测台：黄铜星盘、氧化铜绿、炉火与羊皮纸。所有要素图案都由项目内的 24 × 24 像素绘制代码生成，没有使用任何外部美术素材。

> 在虚无里点燃第一簇火，然后看看万物愿不愿意跟你走。

## 运行

需要 Node.js 18+。

```bash
npm install
npm run dev
```

打开 Vite 打印的本地地址。生产构建与预览：

```bash
npm run build
npm run preview
```

数据、章节与完整试玩逻辑校验：

```bash
npm run validate
```

## 已经完成的玩法

- 从**火、水、土、风**四种源初要素开始，两两投入熔炉。
- **389 个原创要素**，分为 12 种类型：源初、天象、矿物、生灵、植物、动物、人间、造物、科技、秘法、星海、哲理。
- **388 条配方**，部分要素拥有多条合成路径。
- 每个要素都有独立的像素图案和一段原创描述。
- 图鉴搜索、类型筛选、未解轮廓、要素档案、已知配方与用途统计。
- 七章「创世手记」，共 32 个章节目标，带章节引子、完成旁白、灵光奖励与源初馈赠。
- 六种终局要素，最短合成链深度为 **7–11 层**：
  - 生命之树（10 层）
  - 时间之河（7 层）
  - 星辰王冠（7 层）
  - 世界之核（8 层）
  - 神谕之心（10 层）
  - 万象归一（11 层，需先合成前两个终局要素）
- 灵光提示系统：优先指向当前章节目标，只使用已经发现的要素。
- 连续失败会积攒灵光；每发现 10 个要素也会获得灵光。
- 发现卡、章节完成卡、终局仪式与结局演出。
- 本地自动存档、熔炼统计、成功率、重置进度。
- Web Audio 实时合成音效（默认关闭）。
- 桌面端优先布局，按需求不做移动端适配。

## 操作

| 操作 | 说明 |
| --- | --- |
| 点选图鉴卡片 | 将一个要素放入熔炉（最多两个） |
| 点熔炉槽位的 × | 取出该要素 |
| 按「熔炼」或 `Enter` | 组合两个要素 |
| `/` | 聚焦要素搜索 |
| `M` | 开关声音 |
| `Esc` | 关闭面板 / 清空熔炉 |
| 悬停卡片后点左上角 `i` | 打开要素档案 |

## 设计方向

- **主题**：深空炼金观测台，而不是中式仙侠。黄铜星盘是唯一的主角，其余界面保持克制。
- **色彩**：`#071215` 虚空深青、`#0d1f26` 仪表底、`#e9d7b1` 羊皮纸文字、`#d5a05b` 黄铜、`#6cb8a3` 氧化铜绿、`#df6b43` 炉火橙。
- **字体**：自托管方舟像素字体（标题与界面）+ 系统宋体（描述与叙事），让仪器读数和手抄本叙事形成对照。
- **布局**：左侧环形星盘熔炉，右侧章节手记，下方整幅要素标本柜。
- **动效**：开场一次完整的星盘苏醒仪式；此后动效只回应玩家动作。`prefers-reduced-motion` 下静帧呈现。
- **像素画**：24 × 24 逻辑像素，统一描边、三阶明暗和少量抖动；要素的调色板与细节由要素 ID 与图形名称确定性生成。

## 项目结构

```text
index.html                 页面骨架与像素 favicon
src/main.jsx               React 入口
src/App.jsx                游戏状态、熔炉流程、存档与面板编排
src/styles.css             完整视觉系统
src/audio.js               Web Audio 合成音效
src/art/pixel.js           像素网格、描边、随机数与绘制工具
src/art/palette.js         调色板家族与按要素派生颜色
src/art/shapes.js          约 120 种图形名到像素绘制函数的映射与组合
src/art/sprites.js         像素画布生成与缓存
src/art/Skyfield.jsx       深空星场背景
src/art/CrucibleCanvas.jsx 星盘熔炉、炉火、烟与余烬
src/data/elements/         按类型拆分的要素、描述、配方与图案参数
src/data/chapters.js       七章手记、任务与结局
src/data/categories.js     类型与类型色
src/data/schema.js         存档版本、根要素与终局要素定义
src/game/recipes.js        配方索引与查询
src/game/progress.js       存档、合成、章节推进、奖励与统计
src/game/hints.js          灵光候选与优先级
src/ui/                    顶栏、熔炉、手记、图鉴、弹窗和覆盖层
scripts/validate.mjs       数据与完整通关自检
dev/sprite-gallery.html    全部像素图预览页（仅开发用）
dev/seed.html              各类进度种子页（仅开发用）
public/fonts/              方舟像素字体与 SIL OFL 许可证
```

开发预览页：

- `/dev/sprite-gallery.html`：平铺 389 个要素像素图。
- `/dev/seed.html?p=fresh`：显示开场。
- `/dev/seed.html?p=chapter0`：序章只差「泥」。
- `/dev/seed.html?p=ending`：除「万象归一」外全部发现，可直接测试终局。

这些页面不会被生产构建收录。

## 自检与验收

`npm run validate` 会检查：

- 要素数量 > 300、ID 与名称唯一、每个要素都有足够长度的描述和已绘制的像素图形。
- 所有配方引用有效，没有自我合成或重复配方对。
- 所有要素都能从源初要素抵达。
- 至少 5 个终局要素最短深度 ≥ 6。
- 每个章节的目标在对应解锁阶段可抵达，终章包含至少 5 个终局要素。
- 自动从四种源初要素开始模拟完整通关：必须抵达全部 389 个要素、完成全部 7 章并触发结局。
- 失败熔炼与灵光提示的烟雾测试。

当前结果：

```text
✓ 数据校验通过
要素总数：389
配方数：388
完整试玩：383 次熔炼 · 389 个要素 · 7 章 · 结局已触发
```

`npm run build` 已通过，产物在 `dist/`。

## 参考与致谢

- 玩法参考：[Little Alchemy](https://littlealchemy.com/) 与 [Doodle God](https://doodlegod.com/)。
- 章节任务结构参考：[Doodle God 任务攻略](https://steamcommunity.com/sharedfiles/filedetails/?id=2692588926)。
- 配方与要素关系的研究参考：[redfast00/element-alchemy-cheater](https://github.com/redfast00/element-alchemy-cheater)。
- 所有要素名称、配方、描述、章节文本与像素图案均为本项目原创，没有复制上述游戏的素材或文案。
- 方舟像素字体（Ark Pixel Font）作者 TakWolf，SIL Open Font License 1.1，许可证见 `public/fonts/ARK-PIXEL-OFL.txt`。
- 音效由 Web Audio API 实时合成，没有外部音频文件。
