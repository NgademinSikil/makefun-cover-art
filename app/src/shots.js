// Fixed scenes for screenshots: ?shot=editor shows the studio with a
// sample photo loaded; ?shot=cover shows only the exported cover, full
// frame, drawn at the viewport's own size. Query params pick the layout,
// grade, title and subtitle. window.__shotReady is set once painted.

import { drawCover, SIZES } from './cover.js';

export async function runShot(shot, query, state, images, redraw, syncPickers) {
  const layout = query.get('layout');
  const grade = query.get('grade');
  const style = query.get('style');
  const size = query.get('size');
  const caption = query.get('caption');
  const subtitle = query.get('subtitle');
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  if (style) state.titleStyle = style;
  if (size && SIZES[size]) state.size = size;
  if (caption) state.title = caption;
  if (subtitle) state.subtitle = subtitle;
  syncPickers();

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = vw;
    canvas.height = vh;
    drawCover(canvas, images, state);
  } else {
    redraw();
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}
