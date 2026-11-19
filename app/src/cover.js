// Neon Coast — the cover engine. Everything here is drawn by hand on a 2D
// canvas from the photos the user loads: no stock art, no game logos, no
// licensed fonts, just panels, a sunset grade and big hand-set lettering.
// A cover is a state object (see defaultState) plus an array of loaded
// images; drawCover paints it at any pixel size, so the live preview and
// the exported PNG are the same picture at different resolutions.

export const LAYOUTS = {
  hero:   { name: 'Full Bleed', panels: 1 },
  hero3:  { name: 'Hero + Three', panels: 4 },
  grid4:  { name: 'Four Panel', panels: 4 },
  mosaic: { name: 'Nine Panel', panels: 9 },
  tilt:   { name: 'Tilted Snaps', panels: 3 },
  strip:  { name: 'Comic Strip', panels: 3 },
};

export const GRADES = {
  sunset: { name: 'Vice Sunset', filter: 'saturate(1.35) contrast(1.08)', top: '#ff9a3d', mid: '#ff4d7e', bottom: '#7b2ff7', alpha: 0.34 },
  neon:   { name: 'Neon Pink',   filter: 'saturate(1.65) contrast(1.12) hue-rotate(-12deg)', top: '#ff2e88', mid: '#b14dff', bottom: '#00e5ff', alpha: 0.36 },
  purple: { name: 'Purple Haze', filter: 'saturate(1.3) contrast(1.06) hue-rotate(24deg)', top: '#c44dff', mid: '#7b2ff7', bottom: '#2b1055', alpha: 0.38 },
  teal:   { name: 'Teal Night',   filter: 'saturate(1.25) contrast(1.06) hue-rotate(38deg)', top: '#19e3c2', mid: '#1f7ae0', bottom: '#101a4d', alpha: 0.34 },
  gold:   { name: 'Golden Hour', filter: 'saturate(1.45) contrast(1.05) sepia(0.28)', top: '#ffd76a', mid: '#ff8a3d', bottom: '#8a2b12', alpha: 0.30 },
};

export const TITLE_STYLES = {
  sunset: { name: 'Sunset Fill', fill: 'gradient', stroke: '#2b0a3d', glow: 'rgba(255,120,60,0.55)' },
  neon:   { name: 'Neon Glow',   fill: '#ffffff', stroke: '#ff2e88', glow: 'rgba(255,46,136,0.9)' },
  outline:{ name: 'Bold Outline',fill: '#ffffff', stroke: '#14101f', glow: 'rgba(0,0,0,0.45)' },
  gold:   { name: 'Gold Leaf',   fill: 'gradient-gold', stroke: '#3d1c05', glow: 'rgba(255,190,60,0.5)' },
};

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

// Panel rectangles for a layout, as fractions of the canvas (x, y, w, h).
// A small gutter between panels gives the poster its white grid lines.
export function layoutRects(layout, w, h) {
  const g = 0.008; // gutter, in fractions of the short side
  const gw = g * Math.min(w, h);
  const gh = g * Math.min(w, h);
  switch (layout) {
    case 'hero':
      return [{ x: 0, y: 0, w, h, rot: 0 }];
    case 'hero3': {
      const top = h * 0.64;
      const cell = (w - gw * 2) / 3;
      return [
        { x: 0, y: 0, w, h: top, rot: 0 },
        { x: 0, y: top + gh, w: cell, h: h - top - gh, rot: 0 },
        { x: cell + gw, y: top + gh, w: cell, h: h - top - gh, rot: 0 },
        { x: cell * 2 + gw * 2, y: top + gh, w: cell, h: h - top - gh, rot: 0 },
      ];
    }
    case 'grid4': {
      const cw = (w - gw) / 2;
      const ch = (h - gh) / 2;
      return [
        { x: 0, y: 0, w: cw, h: ch, rot: 0 },
        { x: cw + gw, y: 0, w: cw, h: ch, rot: 0 },
        { x: 0, y: ch + gh, w: cw, h: ch, rot: 0 },
        { x: cw + gw, y: ch + gh, w: cw, h: ch, rot: 0 },
      ];
    }
    case 'mosaic': {
      const cw = (w - gw * 2) / 3;
      const ch = (h - gh * 2) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: c * (cw + gw), y: r * (ch + gh), w: cw, h: ch, rot: 0 });
        }
      }
      return out;
    }
    case 'tilt': {
      const cw = w * 0.52;
      return [
        { x: w * 0.04, y: h * 0.03, w: cw, h: h * 0.48, rot: -0.06 },
        { x: w * 0.44, y: h * 0.06, w: cw, h: h * 0.48, rot: 0.07 },
        { x: w * 0.24, y: h * 0.36, w: cw, h: h * 0.42, rot: -0.02 },
      ];
    }
    case 'strip': {
      const cw = (w - gw * 2) / 3;
      return [
        { x: 0, y: 0, w: cw, h, rot: 0 },
        { x: cw + gw, y: 0, w: cw, h, rot: 0 },
        { x: cw * 2 + gw * 2, y: 0, w: cw, h, rot: 0 },
      ];
    }
    default:
      return [{ x: 0, y: 0, w, h, rot: 0 }];
  }
}

export function defaultState() {
  const panels = [];
  for (let i = 0; i < 9; i++) {
    panels.push({ photo: i % 4, zoom: 1, x: 0, y: 0, flip: false });
  }
  return {
    layout: 'hero3',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'Sunset Heist',
    titleStyle: 'sunset',
    size: '1080x1080',
    panels,
    grain: true,
    vignette: true,
    frame: true,
    badge: true,
  };
}

// Deterministic pseudo-random numbers, so the grain looks the same on
// every export of the same cover.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPhotoInto(ctx, img, rect, panel) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (panel.flip) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * panel.zoom;
  const pw = iw * base;
  const ph = ih * base;
  const cx = x + w / 2 + panel.x * w;
  const cy = y + h / 2 + panel.y * h;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family, weight) {
  let size = startSize;
  for (;;) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth || size <= 10) return size;
    size = Math.max(10, size - 2);
  }
}

export function drawCover(canvas, images, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const style = TITLE_STYLES[state.titleStyle] || TITLE_STYLES.sunset;
  const rects = layoutRects(state.layout, w, h);
  const count = LAYOUTS[state.layout].panels;
  const border = state.frame ? Math.max(2, Math.round(Math.min(w, h) * 0.006)) : 0;

  ctx.filter = 'none';
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  // Photos, one per panel, each with its own crop (zoom / pan / flip).
  for (let i = 0; i < count; i++) {
    const panel = state.panels[i];
    const img = images[panel.photo];
    const rect = rects[i];
    if (!img) continue;
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    ctx.filter = grade.filter;
    drawPhotoInto(ctx, img, rect, panel);
    ctx.restore();
    // White poster border around the panel (thicker on tilted snapshots).
    if (border) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot || 0);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = rect.rot ? border * 2.5 : border;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
  }
  ctx.filter = 'none';

  // The grade: a sunset gradient washed over the whole poster.
  const wash = ctx.createLinearGradient(0, 0, w * 0.25, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalAlpha = grade.alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Warm light rising from the bottom, so the title always sits on colour.
  const low = ctx.createLinearGradient(0, h * 0.55, 0, h);
  low.addColorStop(0, 'rgba(255,90,60,0)');
  low.addColorStop(1, 'rgba(120,10,80,0.42)');
  ctx.fillStyle = low;
  ctx.fillRect(0, 0, w, h);

  // Badge ribbon, top left, and a small date stamp, top right.
  if (state.badge) {
    const pad = Math.round(w * 0.025);
    const bh = Math.round(h * 0.042);
    ctx.save();
    ctx.font = `900 ${Math.round(bh * 0.52)}px "Arial Black", Arial, sans-serif`;
    const label = '★ NEON COAST ★';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = '#14101f';
    ctx.fillRect(pad, pad, tw + pad, bh);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(pad, pad + bh, tw + pad, Math.max(3, bh * 0.12));
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(label, pad + pad / 2, pad + bh / 2 + 1);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(bh * 0.45)}px Arial, sans-serif`;
    const stamp = 'EST. 2026';
    const sw = ctx.measureText(stamp).width;
    ctx.fillStyle = 'rgba(20,16,31,0.85)';
    ctx.fillRect(w - pad - sw - pad / 2, pad, sw + pad, bh);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stamp, w - pad - pad / 2, pad + bh / 2 + 1);
    ctx.restore();
  }

  // Title block: big genre lettering with a coloured fill and a hard
  // outline, plus a neon-script subtitle underneath.
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const bandH = h * 0.2;
  const bandY = h - bandH;
  if (title) {
    // Halftone dot row above the title on the sunset style.
    if (state.titleStyle === 'sunset') {
      const dotR = Math.max(2, h * 0.004);
      const gap = dotR * 4;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let x = w * 0.06; x < w * 0.94; x += gap) {
        ctx.beginPath();
        ctx.arc(x, bandY - h * 0.015, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const size = fitFont(ctx, title, w * 0.92, h * 0.115, '"Arial Black", Arial, sans-serif', 900);
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = size * 0.35;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.strokeStyle = style.stroke;
    const ty = h - h * 0.085;
    if (style.fill === 'gradient' || style.fill === 'gradient-gold') {
      const g = ctx.createLinearGradient(0, ty - size, 0, ty);
      if (style.fill === 'gradient') {
        g.addColorStop(0, '#fff7d6');
        g.addColorStop(0.45, '#ffb347');
        g.addColorStop(1, '#ff2e88');
      } else {
        g.addColorStop(0, '#fff3b0');
        g.addColorStop(0.5, '#ffc93d');
        g.addColorStop(1, '#c47a12');
      }
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = style.fill;
    }
    ctx.strokeText(title, w / 2, ty);
    ctx.fillText(title, w / 2, ty);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  if (sub) {
    const subSize = Math.max(14, Math.round(h * 0.038));
    ctx.font = `italic 700 ${subSize}px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,46,136,0.8)';
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(sub, w / 2, h - h * 0.028);
    ctx.shadowBlur = 0;
  }

  // Vignette: darkened corners, like a poster under a lamp.
  if (state.vignette) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,0,25,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  // Film grain: seeded, so the same cover always exports the same PNG.
  if (state.grain) {
    const rnd = mulberry32(20261119);
    const step = Math.max(4, Math.round(Math.min(w, h) / 240));
    ctx.save();
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const v = rnd();
        if (v > 0.88) {
          ctx.fillStyle = v > 0.96 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
          ctx.fillRect(x, y, step, step);
        }
      }
    }
    ctx.restore();
  }

  // Outer white frame, the poster's edge.
  if (state.frame) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, Math.round(Math.min(w, h) * 0.012));
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  }
  return ctx;
}
