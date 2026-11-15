import test from 'node:test';
import assert from 'node:assert/strict';
import { BLACK_LEVELS, WHITE_LEVELS, GRAY_LEVELS, GAMMA_TARGETS, encodeSRGB, gammaByte, patchRects, pixelAt, renderPattern } from '../public/patterns.js';

// A small raster context verifies the generated pixels, not screenshots of text.
function raster(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  const ctx = {
    fillStyle: '', fillText() {},
    fillRect(x, y, w, h) {
      const values = this.fillStyle.match(/\d+/g).map(Number);
      for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
        const offset = (py * width + px) * 4; data.set([...values, 255], offset);
      }
    },
    createImageData(w, h) { return {width: w, height: h, data: new Uint8ClampedArray(w * h * 4)}; },
    putImageData(image, left, top) {
      for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        data.set(image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4), ((y + top) * width + x + left) * 4);
      }
    },
  };
  return {ctx, at(x, y) { return [...data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)]; }};
}

test('sRGB encoding uses the linear toe and correct half-luminance value', () => {
  assert.equal(encodeSRGB(0), 0);
  assert.ok(Math.abs(encodeSRGB(1) - 1) < 1e-12);
  assert.equal(encodeSRGB(0.001), 0.012920000000000001);
  assert.equal(gammaByte('sRGB'), 188);
  assert.equal(gammaByte('2.2'), 186);
  assert.ok(Math.abs(encodeSRGB(0.0031308) - (1.055 * 0.0031308 ** (1 / 2.4) - 0.055)) < 1e-7);
});

for (const [name, levels, background] of [['black', BLACK_LEVELS, 0], ['white', WHITE_LEVELS, 255]]) {
  test(`${name}: patch samples preserve exact full-range code values and opaque background`, () => {
    const image = raster(600, 400);
    renderPattern(image.ctx, name, 600, 400, {labels: false});
    assert.deepEqual(image.at(0, 0), [background, background, background, 255]);
    for (const {x, y, w, h, value} of patchRects(600, 400, levels)) {
      assert.deepEqual(image.at(x + Math.floor(w / 2), y + Math.floor(h / 2)), [value, value, value, 255]);
    }
  });
}
test('gamma surround is an even 50% black/white checker and every target center is correct', () => {
  const width = 600, height = 400, image = raster(width, height);
  renderPattern(image.ctx, 'gamma', width, height, {labels: false});
  GAMMA_TARGETS.forEach((target, i) => {
    const left = 30 + i * 90;
    assert.deepEqual(image.at(left, 60), [0, 0, 0, 255]);
    assert.deepEqual(image.at(left + 1, 60), [255, 255, 255, 255]);
    assert.deepEqual(image.at(left, 61), [255, 255, 255, 255]);
    assert.deepEqual(image.at(left + 35, 170), Array(3).fill(gammaByte(target)).concat(255));
  });
});
test('grayscale includes all 17 neutral steps, including 0 and 255', () => {
  const image = raster(680, 400);
  renderPattern(image.ctx, 'grayscale', 680, 400, {labels: false});
  GRAY_LEVELS.forEach((value, i) => assert.deepEqual(image.at(i * 40 + 20, 180), [value, value, value, 255]));
});
test('gradient rows span 0–255 without mixing channels or omitting endpoints', () => {
  const image = raster(256, 80);
  renderPattern(image.ctx, 'gradients', 256, 80, {labels: false});
  for (let x = 0; x < 256; x++) {
    assert.deepEqual(image.at(x, 5), [x, x, x, 255]);
    assert.deepEqual(image.at(x, 25), [x, 0, 0, 255]);
    assert.deepEqual(image.at(x, 45), [0, x, 0, 255]);
    assert.deepEqual(image.at(x, 65), [0, 0, x, 255]);
  }
});
test('sharpness texture alternates at one backing pixel even with a 2x label scale', () => {
  const image = raster(600, 400);
  renderPattern(image.ctx, 'sharpness', 600, 400, {labels: false, scale: 2});
  assert.equal(image.at(10, 10)[0], 0); assert.equal(image.at(11, 10)[0], 255);
  assert.equal(image.at(250, 10)[0], 0); assert.equal(image.at(250, 11)[0], 255);
  assert.equal(image.at(450, 10)[0], 0); assert.equal(image.at(451, 10)[0], 255);
  assert.deepEqual(image.at(300, 300), [192, 192, 192, 255]);
  assert.deepEqual(image.at(0, 300), [64, 64, 64, 255]);
});
test('single-pixel gradient width avoids invalid channel values', () => assert.deepEqual(pixelAt('gradients', 0, 0, 1, 4), [0, 0, 0]));
