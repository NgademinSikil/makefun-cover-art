// Neon Coast Cover Studio — the page wiring. Loads four sample photos so
// the app opens with a cover already on screen, lets the user swap any
// panel's photo, crop it by drag and zoom, pick a layout and a grade,
// letter the title, then export a PNG in any of the three post sizes.
// Photos are read with FileReader / object URLs only: nothing is uploaded
// anywhere, the whole app works offline from its own files.

import { drawCover, defaultState, LAYOUTS, GRADES, TITLE_STYLES, SIZES, layoutRects } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = ['pier.jpg', 'boulevard.jpg', 'palms.jpg', 'neon.jpg'];
const SAMPLE_NAMES = ['Pier Sunset', 'Boulevard', 'Palm Dusk', 'Neon Street'];

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const state = defaultState();
const images = new Array(4).fill(null);
let selected = 0;          // which panel the crop controls edit
let undoStack = [];
let redoStack = [];
let drag = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function snapshot() {
  return JSON.stringify(state);
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}
function applySnapshot(json) {
  const next = JSON.parse(json);
  Object.assign(state, next);
  state.panels = next.panels;
  syncControls();
  redraw();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  updateUndoButtons();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  updateUndoButtons();
}
function updateUndoButtons() {
  document.getElementById('undo').disabled = !undoStack.length;
  document.getElementById('redo').disabled = !redoStack.length;
}

function previewSize() {
  const s = SIZES[state.size];
  return { w: s.w, h: s.h };
}

function redraw() {
  const { w, h } = previewSize();
  // Keep the preview canvas at a manageable pixel size (max 900 on the
  // long side) so dragging stays fast; exports redraw at full size.
  const scale = Math.min(1, 900 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  drawCover(canvas, images, state);
  highlightPanel();
}

function highlightPanel() {
  const count = LAYOUTS[state.layout].panels;
  const chips = document.querySelectorAll('#panel-chips button');
  chips.forEach((c, i) => {
    c.classList.toggle('active', i === selected);
    c.disabled = i >= count;
  });
  const p = state.panels[selected];
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('panx').value = Math.round(p.x * 100);
  document.getElementById('pany').value = Math.round(p.y * 100);
  document.getElementById('zoom-val').textContent = `${Math.round(p.zoom * 100)}%`;
  document.getElementById('panx-val').textContent = `${Math.round(p.x * 100)}`;
  document.getElementById('pany-val').textContent = `${Math.round(p.y * 100)}`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---- control builders ------------------------------------------------

function buildPickers() {
  const layoutBox = document.getElementById('layout-pick');
  for (const [key, info] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = info.name;
    b.dataset.layout = key;
    b.addEventListener('click', () => {
      pushUndo();
      state.layout = key;
      if (selected >= info.panels) selected = 0;
      syncPickers();
      redraw();
    });
    layoutBox.appendChild(b);
  }
  const gradeBox = document.getElementById('grade-pick');
  for (const [key, info] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.grade = key;
    b.style.background = `linear-gradient(135deg, ${info.top}, ${info.mid} 55%, ${info.bottom})`;
    b.title = info.name;
    b.setAttribute('aria-label', info.name);
    b.addEventListener('click', () => {
      pushUndo();
      state.grade = key;
      syncPickers();
      redraw();
    });
    gradeBox.appendChild(b);
  }
  const styleBox = document.getElementById('style-pick');
  for (const [key, info] of Object.entries(TITLE_STYLES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = info.name;
    b.dataset.style = key;
    b.addEventListener('click', () => {
      pushUndo();
      state.titleStyle = key;
      syncPickers();
      redraw();
    });
    styleBox.appendChild(b);
  }
  const sizeBox = document.getElementById('size-pick');
  for (const [key, info] of Object.entries(SIZES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = info.label;
    b.dataset.size = key;
    b.addEventListener('click', () => {
      state.size = key;
      syncPickers();
      redraw();
    });
    sizeBox.appendChild(b);
  }
  const chips = document.getElementById('panel-chips');
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => { selected = i; highlightPanel(); });
    chips.appendChild(b);
  }
  const sampleBox = document.getElementById('sample-pick');
  SAMPLES.forEach((file, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample';
    b.innerHTML = `<img src="samples/${file}" alt=""><span>${SAMPLE_NAMES[i]}</span>`;
    b.addEventListener('click', async () => {
      pushUndo();
      state.panels[selected].photo = i;
      redraw();
      setStatus(`${SAMPLE_NAMES[i]} is now in panel ${selected + 1}.`);
    });
    sampleBox.appendChild(b);
  });
}

function syncPickers() {
  document.querySelectorAll('#layout-pick button').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#grade-pick button').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#style-pick button').forEach((b) => b.classList.toggle('active', b.dataset.style === state.titleStyle));
  document.querySelectorAll('#size-pick button').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.getElementById('frame').checked = state.frame;
  document.getElementById('badge').checked = state.badge;
}

function syncControls() {
  syncPickers();
  highlightPanel();
}

// ---- export ----------------------------------------------------------

function exportSize(key) {
  const s = SIZES[key];
  const off = document.createElement('canvas');
  off.width = s.w;
  off.height = s.h;
  const keep = state.size;
  state.size = key;
  drawCover(off, images, state);
  state.size = keep;
  return new Promise((resolve) => {
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function exportOne(key) {
  const t0 = performance.now();
  const blob = await exportSize(key);
  await download(blob, `neon-coast-${key}.png`);
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  setStatus(`Saved neon-coast-${key}.png (${(blob.size / 1024).toFixed(0)} KiB) in ${secs}s — photo to PNG.`);
  return blob;
}

// ---- canvas interaction: click a panel to select it, drag to pan ------

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function pickPanelAt(px, py) {
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  const count = LAYOUTS[state.layout].panels;
  for (let i = count - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return 0;
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  selected = pickPanelAt(p.x, p.y);
  const panel = state.panels[selected];
  drag = { x: p.x, y: p.y, px: panel.x, py: panel.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
  highlightPanel();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = (p.x - drag.x) / canvas.width;
  const dy = (p.y - drag.y) / canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  const panel = state.panels[selected];
  panel.x = Math.max(-0.5, Math.min(0.5, drag.px + dx));
  panel.y = Math.max(-0.5, Math.min(0.5, drag.py + dy));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushUndo();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  pushUndo();
  const panel = state.panels[selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  redraw();
}, { passive: false });

// ---- wire the rest of the controls ------------------------------------

function wire() {
  buildPickers();
  syncPickers();
  highlightPanel();
  updateUndoButtons();

  document.getElementById('photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pushUndo();
    const img = await loadImage(URL.createObjectURL(file));
    const slot = images.findIndex((im) => im === null);
    const idx = slot === -1 ? (images.push(img) - 1) : slot;
    images[idx] = img;
    state.panels[selected].photo = idx;
    redraw();
    setStatus(`"${file.name}" loaded into panel ${selected + 1}. Photos never leave this machine.`);
    e.target.value = '';
  });

  const titleEl = document.getElementById('title');
  const subEl = document.getElementById('subtitle');
  titleEl.addEventListener('input', () => { state.title = titleEl.value; redraw(); });
  subEl.addEventListener('input', () => { state.subtitle = subEl.value; redraw(); });
  titleEl.addEventListener('change', pushUndo);
  subEl.addEventListener('change', pushUndo);

  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('zoom').addEventListener('change', pushUndo);
  document.getElementById('panx').addEventListener('input', (e) => {
    state.panels[selected].x = Number(e.target.value) / 100;
    redraw();
  });
  document.getElementById('pany').addEventListener('input', (e) => {
    state.panels[selected].y = Number(e.target.value) / 100;
    redraw();
  });
  document.getElementById('panx').addEventListener('change', pushUndo);
  document.getElementById('pany').addEventListener('change', pushUndo);
  document.getElementById('flip').addEventListener('click', () => {
    pushUndo();
    state.panels[selected].flip = !state.panels[selected].flip;
    redraw();
  });
  document.getElementById('reset-crop').addEventListener('click', () => {
    pushUndo();
    Object.assign(state.panels[selected], { zoom: 1, x: 0, y: 0, flip: false });
    redraw();
  });

  for (const id of ['grain', 'vignette', 'frame', 'badge']) {
    document.getElementById(id).addEventListener('change', (e) => {
      pushUndo();
      state[id] = e.target.checked;
      redraw();
    });
  }

  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  document.getElementById('surprise').addEventListener('click', () => {
    pushUndo();
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    const styles = Object.keys(TITLE_STYLES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.titleStyle = styles[Math.floor(Math.random() * styles.length)];
    state.panels.forEach((p) => { p.photo = Math.floor(Math.random() * images.length); });
    if (selected >= LAYOUTS[state.layout].panels) selected = 0;
    syncPickers();
    redraw();
    setStatus('Surprise mix — try another, or undo.');
  });

  document.getElementById('export').addEventListener('click', () => exportOne(state.size));
  document.getElementById('export-all').addEventListener('click', async () => {
    setStatus('Exporting all three sizes…');
    for (const key of Object.keys(SIZES)) {
      // eslint-disable-next-line no-await-in-loop
      await exportOne(key);
    }
    setStatus('All three PNGs exported: 1080×1080, 1080×1350, 1920×1080.');
  });
}

// ---- boot ------------------------------------------------------------

const query = new URLSearchParams(location.search);
const shot = query.get('shot');

async function bootSamples() {
  for (let i = 0; i < SAMPLES.length; i++) {
    try {
      images[i] = await loadImage(`samples/${SAMPLES[i]}`);
    } catch {
      images[i] = null;
    }
  }
}

if (shot) {
  // Screenshot mode: a fixed scene, then window.__shotReady for the camera.
  await bootSamples();
  wire();
  await runShot(shot, query, state, images, redraw, syncPickers);
} else {
  wire();
  await bootSamples();
  redraw();
  setStatus('Four sample photos loaded — click a panel, drag to crop, then export.');
}

// Exposed for the play test: draw any size and hand back the PNG blob.
window.__neonCoast = { state, images, exportSize, redraw, SIZES };
