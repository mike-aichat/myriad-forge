import { ELEMENTS } from "../src/data/elements/index.js";
import { CATEGORY_MAP } from "../src/data/categories.js";
import { spriteUrl } from "../src/art/sprites.js";

const grid = document.querySelector("#grid");
const meta = document.querySelector("#meta");
meta.textContent = `${ELEMENTS.length} 个要素 · 每个 24 × 24 像素 · 代码绘制`;

const fragment = document.createDocumentFragment();
for (const element of ELEMENTS) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img src="${spriteUrl(element)}" alt="${element.name}" />
    <span class="name">${element.name}</span>
    <span class="shape">${element.shape}</span>
    <span class="cat" style="color:${CATEGORY_MAP[element.category].color}">${CATEGORY_MAP[element.category].name}</span>
  `;
  fragment.appendChild(card);
}
grid.appendChild(fragment);
