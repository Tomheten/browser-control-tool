<template>
  <div class="finder-root" :class="{ collapsed: isCollapsed }">
    <!-- Pin area: показывает все закреплённые строки -->
    <div class="pin-area" v-if="pinnedItems.length" ref="pinAreaRef">
      <div
          v-for="p in pinnedItems"
          :key="p.index"
          class="pinned-li"
          @click="toggleUnpin(p.index)"
          :data-index="p.index"
          :style="{ outline: `2px dashed ${nodes[p.index].color}` }"
      >
        <span class="color-dot" :style="{ background: nodes[p.index].color }"></span>
        <span class="index">#{{ p.index + 1 }}</span>
        <span class="path">{{ shortDesc(nodes[p.index]) }}</span>
      </div>
    </div>

    <!-- Results panel -->
    <aside class="results-panel" v-show="!isCollapsed">
      <div class="panel-header">Найденные элементы ({{ visibleNodes.length }})</div>
      <ul class="results-list" ref="listRef">
        <li
            v-for="(n, idx) in visibleNodes"
            :key="n.id"
            class="result-item"
            @mouseenter="startHover(n.index, $event)"
            @mouseleave="endHover(n.index)"
            @click="onClickPin(n.index, $event)"
            :data-index="n.index"
        >
          <span class="color-dot" :style="{ background: nodes[n.index].color }"></span>
          <div class="item-top">
            <span class="index">#{{ n.index + 1 }}</span>
            <span class="path">{{ shortDesc(nodes[n.index]) }}</span>
          </div>
        </li>
        <li v-if="visibleNodes.length === 0" class="empty">Пусто</li>
      </ul>
    </aside>

    <!-- Floating menu -->
    <div class="floating-menu" role="region" aria-label="XPath finder">
      <div v-if="!isCollapsed">
        <input v-model="xpath" class="xpath-input" placeholder="//div" @keyup.enter="findAll" />
        <div class="menu-buttons">
          <button @click="findAll" class="btn">Найти все</button>
          <button @click="highlightAll" class="btn">Подсветить всё</button>
          <button @click="clearAll" class="btn">Очистить</button>
          <button @click="toggleCollapse" class="btn">Свернуть</button>
        </div>
      </div>
      <div v-else>
        <button @click="toggleCollapse" class="btn">Открыть</button>
      </div>
    </div>

    <!-- SVG overlay: hover line (temp) + persistent dashed lines for pinned items -->
    <svg ref="svgRef" class="svg-overlay" xmlns="http://www.w3.org/2000/svg">
      <line
          v-if="hoverLine.visible"
          :x1="hoverLine.x1"
          :y1="hoverLine.y1"
          :x2="hoverLine.x2"
          :y2="hoverLine.y2"
          :stroke="hoverLine.color"
          stroke-width="2"
          stroke-linecap="round"
      />
      <line
          v-for="pl in pinnedLines"
          :key="pl.index"
          :x1="pl.x1"
          :y1="pl.y1"
          :x2="pl.x2"
          :y2="pl.y2"
          :stroke="pl.color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="4 4"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onBeforeUnmount, nextTick } from 'vue';

type NodeInfo = {
  el: HTMLElement;
  id: number;
  color: string;
  originalOutline?: string | null;
  originalZ?: string | null;
  pinned?: boolean;
};

type PinnedLine = { index: number; x1: number; y1: number; x2: number; y2: number; color: string };

let GLOBAL_ID = 1;

function randomColorHex() {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 30);
  const l = 45 + Math.floor(Math.random() * 10);
  return hslToHex(h, s, l);
}
function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const val = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * val).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default defineComponent({
  name: 'XPathFinderMultiPinColoredDashed',
  setup() {
    const xpath = ref('//');
    const isCollapsed = ref(false);
    const nodes = reactive<NodeInfo[]>([]);
    const svgRef = ref<SVGSVGElement | null>(null);
    const listRef = ref<HTMLElement | null>(null);
    const pinAreaRef = ref<HTMLElement | null>(null);

    const hoverLine = reactive<{ visible: boolean; x1: number; y1: number; x2: number; y2: number; idx: number; color: string }>({
      visible: false,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      idx: -1,
      color: '#f33',
    });

    const pinnedItems = reactive<{ index: number }[]>([]);
    const pinnedLines = reactive<PinnedLine[]>([]);

    const visibleNodes = computed(() =>
        nodes.map((n, i) => ({ ...n, index: i })).filter((x) => !nodes[x.index].pinned)
    );

    function evaluateXPath(expr: string): Element[] {
      const out: Element[] = [];
      try {
        const res = document.evaluate(expr, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let n = res.iterateNext();
        while (n) {
          if (n.nodeType === Node.ELEMENT_NODE) out.push(n as Element);
          n = res.iterateNext();
        }
      } catch {
        // ignore invalid xpath
      }
      return out;
    }

    function findAll() {
      clearAll();
      nodes.splice(0, nodes.length);
      const expr = xpath.value.trim();
      if (!expr) return;
      const found = evaluateXPath(expr);
      for (const el of found) {
        const he = el as HTMLElement;
        nodes.push({
          el: he,
          id: GLOBAL_ID++,
          color: randomColorHex(),
          originalOutline: he.style.outline || null,
          originalZ: he.style.zIndex || null,
          pinned: false,
        });
      }
    }

    function highlightAll() {
      for (const info of nodes) {
        preserveSavedOutline(info.el);
        info.el.style.outline = `3px solid ${info.color}`;
      }
    }

    function clearAll() {
      const pinned = pinnedItems.splice(0, pinnedItems.length);
      for (const p of pinned) {
        unpinItem(p.index);
      }
      pinnedLines.splice(0, pinnedLines.length);
      for (const info of nodes) {
        if (info.el.dataset.xpfSavedOutline !== undefined) {
          info.el.style.outline = info.el.dataset.xpfSavedOutline;
          delete info.el.dataset.xpfSavedOutline;
        }
        if (info.el.dataset.xpfSavedZ !== undefined) {
          info.el.style.zIndex = info.el.dataset.xpfSavedZ;
          delete info.el.dataset.xpfSavedZ;
        }
      }
      hoverLine.visible = false;
      hoverLine.idx = -1;
    }

    function preserveSavedOutline(el: HTMLElement) {
      if (el.dataset.xpfSavedOutline === undefined) el.dataset.xpfSavedOutline = el.style.outline || '';
    }
    function preserveSavedZ(el: HTMLElement) {
      if (el.dataset.xpfSavedZ === undefined) el.dataset.xpfSavedZ = el.style.zIndex || '';
    }

    function startHover(idx: number, ev: MouseEvent) {
      const info = nodes[idx];
      if (!info) return;
      hoverLine.idx = idx;
      hoverLine.color = info.color;
      hoverLine.visible = true;

      const startEl = getListElementByIndex(idx) || getPinnedLiElement(idx) || (ev.currentTarget as HTMLElement);
      updateLineFromElements(startEl, info.el, hoverLine);

      if (!info.pinned) {
        preserveSavedOutline(info.el);
        info.el.style.outline = `2px dashed ${info.color}`;
        info.el.dataset.xpfHover = '1';
      }

      window.addEventListener('scroll', onWindowEvent, true);
      window.addEventListener('resize', onWindowEvent);
    }

    function endHover(idx: number) {
      const info = nodes[idx];
      if (info && info.el.dataset.xpfHover === '1') {
        if (!info.pinned) {
          info.el.style.outline = info.el.dataset.xpfSavedOutline ?? '';
        }
        delete info.el.dataset.xpfHover;
      }
      hoverLine.visible = false;
      hoverLine.idx = -1;
      window.removeEventListener('scroll', onWindowEvent, true);
      window.removeEventListener('resize', onWindowEvent);
    }

    async function onClickPin(idx: number, ev: MouseEvent) {
      ev.stopPropagation();
      if (nodes[idx].pinned) {
        unpinItem(idx);
        const i = pinnedItems.findIndex(p => p.index === idx);
        if (i !== -1) pinnedItems.splice(i, 1);
        const li = pinnedLines.findIndex(pl => pl.index === idx);
        if (li !== -1) pinnedLines.splice(li, 1);
        return;
      }

      nodes[idx].pinned = true;
      pinnedItems.push({ index: idx });

      preserveSavedOutline(nodes[idx].el);
      preserveSavedZ(nodes[idx].el);
      nodes[idx].el.style.outline = `3px dashed ${nodes[idx].color}`; // dashed for page element too
      nodes[idx].el.style.zIndex = '999999';

      await nextTick();
      const startEl = getPinnedLiElement(idx) || getListElementByIndex(idx) || null;
      const pl: PinnedLine = { index: idx, x1: 0, y1: 0, x2: 0, y2: 0, color: nodes[idx].color };
      if (startEl) updateLineFromElements(startEl, nodes[idx].el, pl);
      pinnedLines.push(pl);

      window.addEventListener('scroll', onWindowEvent, true);
      window.addEventListener('resize', onWindowEvent);
    }

    function toggleUnpin(idx: number) {
      if (!nodes[idx].pinned) return;
      unpinItem(idx);
      const i = pinnedItems.findIndex(p => p.index === idx);
      if (i !== -1) pinnedItems.splice(i, 1);
      const li = pinnedLines.findIndex(pl => pl.index === idx);
      if (li !== -1) pinnedLines.splice(li, 1);
    }

    function unpinItem(idx: number) {
      const info = nodes[idx];
      if (!info) return;
      info.pinned = false;
      if (info.el.dataset.xpfSavedOutline !== undefined) {
        info.el.style.outline = info.el.dataset.xpfSavedOutline;
        delete info.el.dataset.xpfSavedOutline;
      } else {
        info.el.style.outline = '';
      }
      if (info.el.dataset.xpfSavedZ !== undefined) {
        info.el.style.zIndex = info.el.dataset.xpfSavedZ;
        delete info.el.dataset.xpfSavedZ;
      } else {
        info.el.style.zIndex = '';
      }
    }

    function getListElementByIndex(idx: number): HTMLElement | null {
      if (!listRef.value) return null;
      return listRef.value.querySelector(`li.result-item[data-index="${idx}"]`) as HTMLElement | null;
    }
    function getPinnedLiElement(idx: number): HTMLElement | null {
      if (!pinAreaRef.value) return null;
      return pinAreaRef.value.querySelector(`.pinned-li[data-index="${idx}"]`) as HTMLElement | null;
    }

    function onWindowEvent() {
      if (hoverLine.visible && hoverLine.idx >= 0) {
        const idx = hoverLine.idx;
        const startEl = getPinnedLiElement(idx) || getListElementByIndex(idx) || null;
        if (startEl && nodes[idx]) updateLineFromElements(startEl, nodes[idx].el, hoverLine);
      }
      for (const pl of pinnedLines) {
        const startEl = getPinnedLiElement(pl.index) || getListElementByIndex(pl.index) || null;
        if (startEl && nodes[pl.index]) updateLineFromElements(startEl, nodes[pl.index].el, pl);
      }
    }

    function updateLineFromElements(startEl: HTMLElement | null, targetEl: HTMLElement, lineObj: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
      const svg = svgRef.value;
      if (!svg || !startEl) return;
      const svgRect = svg.getBoundingClientRect();
      const s = startEl.getBoundingClientRect();
      const t = targetEl.getBoundingClientRect();
      lineObj.x1 = s.right - svgRect.left;
      lineObj.y1 = s.top + s.height / 2 - svgRect.top;
      lineObj.x2 = t.left + t.width / 2 - svgRect.left;
      lineObj.y2 = t.top + t.height / 2 - svgRect.top;
    }

    function shortDesc(info: NodeInfo | undefined) {
      if (!info) return '';
      const el = info.el as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className ? `.${String(el.className).split(/\s+/).join('.')}` : '';
      return `${tag}${id}${cls}`;
    }

    onBeforeUnmount(() => {
      clearAll();
      window.removeEventListener('scroll', onWindowEvent, true);
      window.removeEventListener('resize', onWindowEvent);
    });

    return {
      xpath,
      isCollapsed,
      nodes,
      visibleNodes,
      svgRef,
      listRef,
      pinAreaRef,
      hoverLine,
      pinnedItems,
      pinnedLines,
      findAll,
      highlightAll,
      clearAll,
      toggleCollapse: () => (isCollapsed.value = !isCollapsed.value),
      startHover,
      endHover,
      onClickPin,
      toggleUnpin,
      shortDesc,
      // simple attrsMap if needed externally
      attrsMap: (el: Element) => {
        const out: Record<string, string> = {};
        const he = el as HTMLElement;
        if (he.id) out.id = he.id;
        if (he.className) out.class = String(he.className);
        if (he.getAttribute('name')) out.name = String(he.getAttribute('name'));
        for (let i = 0; i < he.attributes.length; i++) {
          const at = he.attributes[i];
          if (at.name.startsWith('data-')) out[at.name] = at.value;
        }
        out.tag = he.tagName.toLowerCase();
        const txt = (he.textContent || '').trim().slice(0, 120);
        if (txt) out.text = txt.length > 80 ? txt.slice(0, 80) + '…' : txt;
        return out;
      },
    };
  },
});
</script>

<style scoped>
.finder-root {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 99999;
  display: flex;
  gap: 8px;
  pointer-events: none;
}
.finder-root * { pointer-events: auto; }

.pin-area {
  width: 300px;
  margin-bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: auto;
}
.pinned-li {
  padding: 6px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

/* small color dot for each item */
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  flex: 0 0 12px;
  margin-right: 6px;
  border: 1px solid rgba(0,0,0,0.08);
}

.results-panel { width: 300px; max-height: 60vh; background: #fff; border: 1px solid #ccc; padding: 6px; overflow: auto; box-sizing: border-box; }
.panel-header { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.results-list { list-style: none; margin: 0; padding: 0; }
.result-item { padding: 6px; cursor: pointer; font-size: 13px; border-bottom: 1px solid #f0f0f0; background: #fff; display:flex; align-items:center; }
.result-item:hover { background: #f8f8f8; }
.item-top { display:flex; gap:8px; align-items:center; flex:1; }
.index { color:#666; width:32px; display:inline-block; }
.path { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.floating-menu { width: 260px; background: #fff; border: 1px solid #ccc; padding: 8px; box-sizing: border-box; }
.xpath-input { width: 100%; padding: 6px; border: 1px solid #bbb; font-size: 13px; box-sizing: border-box; }
.menu-buttons { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
.btn { padding:6px 8px; font-size:13px; border:1px solid #999; background:#eee; cursor:pointer; }

/* SVG overlay */
.svg-overlay { position: fixed; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 99998; }

/* collapsed */
.finder-root.collapsed .results-panel { display: none; }
</style>
