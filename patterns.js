// Values are encoded sRGB bytes, not linear-light brightness percentages.
export const BLACK_LEVELS = [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32];
export const WHITE_LEVELS = [223, 231, 239, 243, 247, 249, 250, 251, 252, 253, 254, 255];
export const GRAY_LEVELS = [0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 255];
export const GAMMA_TARGETS = ['1.8', '2.0', '2.2', 'sRGB', '2.4', '2.6'];
export function encodeSRGB(linear) {
  return linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
}
export function gammaByte(target, linear = 0.5) {
  return Math.round(255 * (target === 'sRGB' ? encodeSRGB(linear) : linear ** (1 / Number(target))));
}
export function patchRects(width, height, levels) {
  const cols = 6, rows = 2, cellW = width * 0.84 / cols, cellH = height * 0.68 / rows;
  return levels.map((value, i) => ({
    x: Math.round(width * 0.08 + i % cols * cellW + cellW * 0.1),
    y: Math.round(height * 0.12 + Math.floor(i / cols) * cellH),
    w: Math.floor(cellW * 0.8), h: Math.floor(cellH * 0.64), value
  }));
}
export function pixelAt(name, x, y, width, height) {
  if (name === 'gradients') {
    const value = Math.round(255 * x / Math.max(1, width - 1));
    const channel = Math.min(3, Math.floor(y * 4 / height));
    return channel === 0 ? [value, value, value] : [channel === 1 ? value : 0, channel === 2 ? value : 0, channel === 3 ? value : 0];
  }
  if (name === 'sharpness') {
    // All frequencies are defined in backing-store pixels, not CSS pixels.
    if (y < height / 2) {
      if (x < width / 3) return Array(3).fill((x % 2) * 255);
      if (x < width * 2 / 3) return Array(3).fill((y % 2) * 255);
      return Array(3).fill(((x + y) % 2) * 255);
    }
    const dx = Math.abs(x - width / 2), dy = Math.abs(y - height * 0.75);
    const nearEdge = dx < width * 0.22 && dy < height * 0.12;
    return Array(3).fill(nearEdge ? 192 : 64);
  }
  return [0, 0, 0];
}
export function renderPattern(ctx, name, width, height, { labels = true, scale = 1, suppressFooter = false } = {}) {
  ctx.imageSmoothingEnabled = false;
  const gray = v => `rgb(${v},${v},${v})`;
  const fill = (value, x, y, w, h) => { ctx.fillStyle = gray(value); ctx.fillRect(x, y, w, h); };
  const label = (text, x, y, value = 140, align = 'center') => {
    if (!labels) return;
    ctx.fillStyle = gray(value); ctx.font = `${Math.max(11, Math.round(12 * scale))}px ui-monospace, monospace`; ctx.textAlign = align;
    ctx.fillText(text, Math.round(x), Math.round(y));
  };
  if (name === 'black' || name === 'white') {
    const white = name === 'white'; fill(white ? 255 : 0, 0, 0, width, height);
    for (const r of patchRects(width, height, white ? WHITE_LEVELS : BLACK_LEVELS)) {
      fill(r.value, r.x, r.y, r.w, r.h);
      label(String(r.value).padStart(3, '0'), r.x + r.w / 2, r.y + r.h + 22 * scale, white ? 120 : 130);
    }
    if (!suppressFooter) label(white ? 'BACKGROUND 255 / 255 / 255' : 'BACKGROUND 0 / 0 / 0', width / 2, height * 0.92, white ? 120 : 100);
  } else if (name === 'gamma') {
    fill(48, 0, 0, width, height);
    const cellW = Math.floor(width * 0.9 / 6), top = Math.round(height * 0.15), h = Math.floor(height * 0.65);
    GAMMA_TARGETS.forEach((target, i) => {
      const left = Math.round(width * 0.05) + i * cellW;
      const w = Math.floor(cellW * 0.86 / 2) * 2;
      const image = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const offset = (y * w + x) * 4, v = (x + y) % 2 * 255;
        image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = v; image.data[offset + 3] = 255;
      }
      ctx.putImageData(image, left, top);
      fill(gammaByte(target), left + Math.floor(w * 0.23), top + Math.floor(h * 0.22), Math.floor(w * 0.54), Math.floor(h * 0.56));
      label(target, left + w / 2, top + h + 26 * scale, 200);
    });
  } else if (name === 'grayscale') {
    fill(32, 0, 0, width, height);
    GRAY_LEVELS.forEach((v, i) => {
      const x = Math.round(i * width / GRAY_LEVELS.length), next = Math.round((i + 1) * width / GRAY_LEVELS.length);
      fill(v, x, Math.round(height * 0.12), next - x, Math.round(height * 0.7));
      label(v, (x + next) / 2, height * 0.9, 180);
    });
  } else {
    const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4, rgb = pixelAt(name, x, y, width, height);
      image.data[p] = rgb[0]; image.data[p + 1] = rgb[1]; image.data[p + 2] = rgb[2]; image.data[p + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    if (name === 'gradients') ['GRAY', 'RED', 'GREEN', 'BLUE'].forEach((v, i) => label(v, 15 * scale, (i + 0.5) * height / 4, 170, 'left'));
  }
}
