#!/usr/bin/env node
// Run with: node tools/test-grid-detector.mjs
//
// Self-contained test harness for GridDetector. We can't easily import the
// TypeScript source from a plain Node script without a build step, so we copy
// the pure-core algorithm here and exercise it with synthetic Float32Array
// grids. Whenever you change the algorithm in src/lib/GridDetector.ts,
// keep the pure-core block below in sync (it's intentionally identical to the
// `detectGridFromGrayscale` function and its helpers).

import { test } from "node:test";
import assert from "node:assert/strict";

// --- pure-core algorithm copy --------------------------------------------------

function buildProjections(gray, width, height) {
  const colProj = new Float32Array(width);
  const rowProj = new Float32Array(height);
  for (let y = 2; y < height - 2; y++) {
    const rowOffset = y * width;
    const upOffset = (y - 2) * width;
    const downOffset = (y + 2) * width;
    for (let x = 2; x < width - 2; x++) {
      const v = gray[rowOffset + x];
      const horizResp = Math.abs(2 * v - gray[rowOffset + x - 2] - gray[rowOffset + x + 2]);
      const vertResp = Math.abs(2 * v - gray[upOffset + x] - gray[downOffset + x]);
      colProj[x] += horizResp;
      rowProj[y] += vertResp;
    }
  }
  return { colProj, rowProj };
}

function autocorrelate(signal, lagMin, lagMax) {
  const n = signal.length;
  const ac = new Float32Array(lagMax + 1);
  let mean = 0;
  for (let i = 0; i < n; i++) mean += signal[i];
  mean /= n;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    const limit = n - lag;
    if (limit <= 0) { ac[lag] = 0; continue; }
    let sum = 0;
    for (let i = 0; i < limit; i++) sum += (signal[i] - mean) * (signal[i + lag] - mean);
    ac[lag] = sum / limit;
  }
  return ac;
}

function findPeak(ac, lagMin, lagMax, expectedLag = null) {
  const useWeight = expectedLag !== null && expectedLag > 0;
  const sigma = useWeight ? Math.max(3, expectedLag * 0.15) : 1;
  let peakLag = lagMin;
  let peakWeighted = -Infinity;
  let peakRaw = -Infinity;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let weight = 1;
    if (useWeight) {
      const z = (lag - expectedLag) / sigma;
      weight = Math.exp(-0.5 * z * z);
    }
    const v = ac[lag] * weight;
    if (v > peakWeighted) {
      peakWeighted = v;
      peakRaw = ac[lag];
      peakLag = lag;
    }
  }
  if (!useWeight) {
    const fundamentalThreshold = 0.85 * peakRaw;
    for (let divisor = 4; divisor >= 2; divisor--) {
      const candidate = Math.round(peakLag / divisor);
      if (candidate < lagMin || candidate > lagMax) continue;
      if (ac[candidate] >= fundamentalThreshold) {
        peakLag = candidate;
        peakRaw = ac[candidate];
      }
    }
  }
  const range = lagMax - lagMin + 1;
  const window = new Array(range);
  for (let i = 0; i < range; i++) window[i] = ac[lagMin + i];
  window.sort((a, b) => a - b);
  const median = window[Math.floor(window.length / 2)];
  let refined = peakLag;
  if (peakLag > lagMin && peakLag < lagMax) {
    const a = ac[peakLag - 1];
    const b = ac[peakLag];
    const c = ac[peakLag + 1];
    const denom = a - 2 * b + c;
    if (denom !== 0) {
      const delta = 0.5 * (a - c) / denom;
      if (Number.isFinite(delta) && Math.abs(delta) < 1) refined = peakLag + delta;
    }
  }
  const denomConfidence = Math.max(Math.abs(peakRaw), 1e-9);
  const confidence = Math.max(0, Math.min(1, (peakRaw - median) / denomConfidence));
  const boundaryLocked = peakLag === lagMin || peakLag === lagMax;
  return { lag: refined, rawLag: peakLag, peakValue: peakRaw, confidence, boundaryLocked };
}

function templateScan(signal, sizeMin, sizeMax, sizeStep) {
  let bestW = sizeMin;
  let bestP = 0;
  let bestScore = -Infinity;
  for (let W = sizeMin; W <= sizeMax; W += sizeStep) {
    if (W < 2) continue;
    const phaseLimit = Math.min(Math.ceil(W), 200);
    let phaseBest = 0;
    let phaseBestScore = -Infinity;
    for (let P = 0; P < phaseLimit; P++) {
      let sum = 0;
      let count = 0;
      for (let k = 0; ; k++) {
        const pos = P + k * W;
        if (pos >= signal.length - 1) break;
        const i0 = Math.floor(pos);
        const frac = pos - i0;
        sum += signal[i0] * (1 - frac) + signal[i0 + 1] * frac;
        count++;
      }
      const normalised = count > 0 ? sum / count : 0;
      if (normalised > phaseBestScore) { phaseBestScore = normalised; phaseBest = P; }
    }
    if (phaseBestScore > bestScore) { bestScore = phaseBestScore; bestW = W; bestP = phaseBest; }
  }
  return { size: bestW, offset: bestP, score: bestScore };
}

function findPhase(signal, period) {
  const periodInt = Math.round(period);
  if (periodInt < 2) return 0;
  let bestPhase = 0;
  let bestScore = -Infinity;
  const n = signal.length;
  for (let phase = 0; phase < periodInt; phase++) {
    let score = 0;
    for (let k = 0; phase + k * periodInt < n; k++) score += signal[phase + k * periodInt];
    if (score > bestScore) { bestScore = score; bestPhase = phase; }
  }
  return bestPhase;
}

function extractTile(gray, fullW, x, y, w, h) {
  const out = new Float32Array(w * h);
  for (let dy = 0; dy < h; dy++) {
    const srcRow = (y + dy) * fullW + x;
    out.set(gray.subarray(srcRow, srcRow + w), dy * w);
  }
  return out;
}

function detectGridFromGrayscaleSingle(gray, width, height, options = {}) {
  const minDim = Math.min(width, height);
  const absoluteMaxLag = Math.max(20, Math.floor(minDim / 4));
  const padFrac = options.searchPaddingFraction ?? 0.5;
  const expected = options.expectedScale && options.expectedScale > 0 && options.expectedScale < 1
    ? options.expectedScale * width
    : null;
  const lagMin = expected ? Math.max(20, Math.floor(expected * (1 - padFrac))) : 20;
  const lagMax = expected ? Math.min(absoluteMaxLag, Math.ceil(expected * (1 + padFrac))) : absoluteMaxLag;
  if (lagMax <= lagMin + 1) {
    return { detected: false, size: expected ?? 0, offsetX: 0, offsetY: 0, confidence: 0 };
  }
  const { colProj, rowProj } = buildProjections(gray, width, height);
  const trimFrac = options.edgeTrimFraction ?? 0.05;
  const trimX = Math.max(0, Math.floor(width * trimFrac));
  const trimY = Math.max(0, Math.floor(height * trimFrac));
  const colProjInner = colProj.slice(trimX, width - trimX);
  const rowProjInner = rowProj.slice(trimY, height - trimY);
  const acX = autocorrelate(colProjInner, lagMin, lagMax);
  const acY = autocorrelate(rowProjInner, lagMin, lagMax);
  const peakX = findPeak(acX, lagMin, lagMax, expected);
  const peakY = findPeak(acY, lagMin, lagMax, expected);
  const sizeX = peakX.lag;
  const sizeY = peakY.lag;
  const phaseToImage = (phase, period, trim) => {
    const p = Math.max(1, Math.round(period));
    return ((phase + trim) % p + p) % p;
  };
  const offsetX = phaseToImage(findPhase(colProjInner, sizeX), sizeX, trimX);
  const offsetY = phaseToImage(findPhase(rowProjInner, sizeY), sizeY, trimY);
  const confidence = Math.min(peakX.confidence, peakY.confidence);
  const threshold = options.confidenceThreshold ?? 0.25;
  const squareTol = options.squareToleranceFraction ?? 0.05;
  const minSize = Math.min(sizeX, sizeY);
  const squareDelta = minSize > 0 ? Math.abs(sizeX - sizeY) / minSize : Infinity;
  const squareOk = squareDelta <= squareTol;
  const boundaryLocked = peakX.boundaryLocked || peakY.boundaryLocked;
  const size = squareOk ? (sizeX + sizeY) / 2 : sizeX;
  const priorDeviation = expected ? Math.abs(size - expected) / expected : 0;
  const tooFarFromPrior = expected !== null && priorDeviation > 0.25;
  const priorAgrees = expected !== null && priorDeviation < 0.10;
  const effectiveThreshold = priorAgrees ? Math.min(threshold, 0.08) : threshold;
  const detected = confidence >= effectiveThreshold && squareOk && !boundaryLocked && !tooFarFromPrior;
  return { detected, size, offsetX, offsetY, confidence, sizeX, sizeY, boundaryLocked, priorDeviation };
}

function detectGridViaRegions(gray, width, height, expected, options) {
  const tileCount = 3;
  const tileW = Math.floor(width / tileCount);
  const tileH = Math.floor(height / tileCount);
  if (tileW < 200 || tileH < 200) return null;
  const tileResults = [];
  for (let ty = 0; ty < tileCount; ty++) {
    for (let tx = 0; tx < tileCount; tx++) {
      const x0 = tx * tileW;
      const y0 = ty * tileH;
      const tile = extractTile(gray, width, x0, y0, tileW, tileH);
      const tileOpts = {
        ...options,
        expectedScale: expected ? expected / tileW : undefined,
        confidenceThreshold: 0.05,
      };
      const result = detectGridFromGrayscaleSingle(tile, tileW, tileH, tileOpts);
      tileResults.push({ result, tileX: x0, tileY: y0 });
    }
  }
  const consistent = tileResults.filter(({ result }) => {
    if (!result.size || result.size <= 0) return false;
    if (expected !== null) {
      const dev = Math.abs(result.size - expected) / expected;
      if (dev > 0.15) return false;
    }
    return result.confidence > 0.05;
  });
  const minAgreeing = Math.max(3, Math.ceil(tileResults.length / 3));
  if (consistent.length < minAgreeing) return null;
  const sizes = consistent.map((c) => c.result.size).sort((a, b) => a - b);
  const medianSize = sizes[Math.floor(sizes.length / 2)];
  const period = Math.round(medianSize);
  if (period < 1) return null;
  const wrap = (v) => ((v % period) + period) % period;
  const globalX = consistent.map((c) => wrap(c.tileX + c.result.offsetX)).sort((a, b) => a - b);
  const globalY = consistent.map((c) => wrap(c.tileY + c.result.offsetY)).sort((a, b) => a - b);
  const meanConfidence = consistent.reduce((s, c) => s + c.result.confidence, 0) / consistent.length;
  const agreementRatio = consistent.length / tileResults.length;
  const confidence = Math.min(1, meanConfidence + agreementRatio * 0.15);
  return {
    detected: true,
    size: medianSize,
    offsetX: globalX[Math.floor(globalX.length / 2)],
    offsetY: globalY[Math.floor(globalY.length / 2)],
    confidence,
    sizeX: medianSize,
    sizeY: medianSize,
    boundaryLocked: false,
    priorDeviation: expected ? Math.abs(medianSize - expected) / expected : 0,
  };
}

function detectGridFromGrayscale(gray, width, height, options = {}) {
  const direct = detectGridFromGrayscaleSingle(gray, width, height, options);
  if (direct.detected) return direct;
  if (width >= 600 && height >= 600 && options.expectedScale) {
    const expected = options.expectedScale > 0 && options.expectedScale < 1 ? options.expectedScale * width : null;
    const regional = detectGridViaRegions(gray, width, height, expected, options);
    if (regional?.detected) return regional;
  }
  return direct;
}

// --- synthetic-image helpers --------------------------------------------------

function makeSquareGrid(width, height, gridSize, offsetX, offsetY, lineThickness = 2, bg = 220, line = 60) {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) gray[i] = bg;
  for (let x = ((offsetX % gridSize) + gridSize) % gridSize; x < width; x += gridSize) {
    for (let dx = 0; dx < lineThickness && x + dx < width; dx++) {
      for (let y = 0; y < height; y++) gray[y * width + x + dx] = line;
    }
  }
  for (let y = ((offsetY % gridSize) + gridSize) % gridSize; y < height; y += gridSize) {
    for (let dy = 0; dy < lineThickness && y + dy < height; dy++) {
      for (let x = 0; x < width; x++) gray[(y + dy) * width + x] = line;
    }
  }
  return gray;
}

function makeAsymmetricGrid(width, height, gridX, gridY, offsetX, offsetY) {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) gray[i] = 220;
  for (let x = ((offsetX % gridX) + gridX) % gridX; x < width; x += gridX) {
    for (let y = 0; y < height; y++) gray[y * width + x] = 60;
  }
  for (let y = ((offsetY % gridY) + gridY) % gridY; y < height; y += gridY) {
    for (let x = 0; x < width; x++) gray[y * width + x] = 60;
  }
  return gray;
}

function withNoise(gray, sigma) {
  const out = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const u1 = Math.max(1e-9, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out[i] = Math.max(0, Math.min(255, gray[i] + z * sigma));
  }
  return out;
}

// --- tests --------------------------------------------------------------------

test("detects a clean 50px grid at the origin (thickness 1)", () => {
  const gray = makeSquareGrid(400, 400, 50, 0, 0, 1);
  const result = detectGridFromGrayscale(gray, 400, 400);
  assert.ok(result.detected, `expected detection, got confidence ${result.confidence}`);
  assert.ok(Math.abs(result.size - 50) < 1, `size ${result.size} not within 1 of 50`);
  assert.equal(result.offsetX, 0);
  assert.equal(result.offsetY, 0);
});

test("detects offset grid (size 73, offsetX 12, offsetY 8, thickness 1)", () => {
  const gray = makeSquareGrid(600, 600, 73, 12, 8, 1);
  const result = detectGridFromGrayscale(gray, 600, 600);
  assert.ok(result.detected, `confidence ${result.confidence}`);
  assert.ok(Math.abs(result.size - 73) < 1, `size ${result.size}`);
  assert.equal(result.offsetX, 12);
  assert.equal(result.offsetY, 8);
});

test("uses expectedScale hint to constrain search", () => {
  const gray = makeSquareGrid(800, 800, 80, 0, 0);
  const result = detectGridFromGrayscale(gray, 800, 800, { expectedScale: 80 / 800 });
  assert.ok(result.detected);
  assert.ok(Math.abs(result.size - 80) < 1);
});

test("rejects a uniform image (no grid)", () => {
  const gray = new Float32Array(400 * 400);
  for (let i = 0; i < gray.length; i++) gray[i] = 200;
  const result = detectGridFromGrayscale(gray, 400, 400);
  assert.equal(result.detected, false);
});

test("survives moderate Gaussian noise (sigma 12)", () => {
  const baseSeed = makeSquareGrid(400, 400, 50, 0, 0, 1);
  const gray = withNoise(baseSeed, 12);
  const result = detectGridFromGrayscale(gray, 400, 400);
  assert.ok(result.detected, `noisy detection failed (confidence ${result.confidence})`);
  assert.ok(Math.abs(result.size - 50) < 1.5, `noisy size ${result.size}`);
});

test("rejects heavily asymmetric grids (X=80, Y=50)", () => {
  const gray = makeAsymmetricGrid(400, 400, 80, 50, 0, 0);
  const result = detectGridFromGrayscale(gray, 400, 400);
  // Either rejected, or marked detected=false due to square sanity check.
  assert.equal(result.detected, false, `expected rejection (size ${result.size}, conf ${result.confidence})`);
});

test("hint at the correct period locks onto the right peak", () => {
  const gray = makeSquareGrid(800, 800, 100, 4, 4, 1);
  const result = detectGridFromGrayscale(gray, 800, 800, { expectedScale: 100 / 800 });
  assert.ok(result.detected);
  assert.ok(Math.abs(result.size - 100) < 1.5);
  assert.equal(result.offsetX, 4);
  assert.equal(result.offsetY, 4);
});

test("rejects boundary-locked detections (search bracketed wrong)", () => {
  // Uniform image with one strong column near the search floor - without
  // prior weighting, autocorrelation is monotonic and the picked lag locks
  // at lagMin. The detector should refuse to commit.
  const gray = new Float32Array(400 * 400);
  for (let i = 0; i < gray.length; i++) gray[i] = 200;
  // Deliberately textured stripe every 22 px to land outside any plausible prior.
  for (let y = 0; y < 400; y++) for (let x = 0; x < 400; x += 22) gray[y * 400 + x] = 100;
  const result = detectGridFromGrayscale(gray, 400, 400, { expectedScale: 80 / 400 });
  assert.equal(result.detected, false, `expected rejection (priorDev ${result.priorDeviation}, boundary ${result.boundaryLocked})`);
});

test("edge trim suppresses decorative frame interference", () => {
  // 50-px grid in a 600×600 image with a heavy 30-px black frame around it.
  // Without trimming, the frame's huge gradient at the edges drowns the
  // periodic projection and the detector picks something noisy. Trimming 5%
  // off each edge should make the inner grid the dominant signal.
  const w = 600, h = 600, period = 50, frame = 30;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) gray[i] = 220;
  // Black frame
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < frame || x >= w - frame || y < frame || y >= h - frame) {
        gray[y * w + x] = 10;
      }
    }
  }
  // Inner grid
  for (let y = frame; y < h - frame; y++) {
    for (let x = frame; x < w - frame; x++) {
      if ((x - frame) % period === 0 || (y - frame) % period === 0) gray[y * w + x] = 60;
    }
  }
  const result = detectGridFromGrayscale(gray, w, h, { expectedScale: period / w });
  assert.ok(result.detected, `frame interference still wins (confidence ${result.confidence})`);
  assert.ok(Math.abs(result.size - period) < 1.5, `size ${result.size}`);
});

test("template scan finds the right period inside the prior band", () => {
  // Plain 42-px grid; verify templateScan around the prior recovers it precisely.
  const w = 800, h = 800, period = 42;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) gray[i] = 220;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x % period === 5 || y % period === 7) gray[y * w + x] = 60;
    }
  }
  const colProj = new Float32Array(w);
  for (let y = 2; y < h - 2; y++) {
    const off = y * w;
    for (let x = 2; x < w - 2; x++) {
      colProj[x] += Math.abs(2 * gray[off + x] - gray[off + x - 2] - gray[off + x + 2]);
    }
  }
  const t = templateScan(colProj, 38, 47, 0.1);
  assert.ok(Math.abs(t.size - 42) < 0.5, `template found ${t.size}, expected 42`);
  assert.equal(t.offset, 5);
});

test("region voting recovers when one half of the image lacks the grid", () => {
  // Right half is a uniform decorative panel that drowns the global projection;
  // left half has a clean grid. Single-pass fails, region voting succeeds.
  const w = 800, h = 800, period = 50;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) gray[i] = 220;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w / 2; x++) {
      // grid lines on the left half
      if (x % period === 4 || y % period === 4) gray[y * w + x] = 60;
    }
    for (let x = w / 2; x < w; x++) {
      // bright noise on the right half - still mostly uniform but has some structure
      gray[y * w + x] = 150 + ((x + y) % 30);
    }
  }
  const result = detectGridFromGrayscale(gray, w, h, { expectedScale: period / w });
  assert.ok(result.detected, `expected detection from region voting (confidence ${result.confidence})`);
  assert.ok(Math.abs(result.size - period) < 1.5, `size ${result.size}`);
});

test("adaptive threshold accepts low-confidence detection when prior agrees", () => {
  // Low-contrast grid (line at 195 vs background 200) - single pass produces
  // a real but weak peak. Without the adaptive threshold we'd reject it.
  const gray = makeSquareGrid(600, 600, 50, 0, 0, 1, 200, 195);
  const result = detectGridFromGrayscale(gray, 600, 600, { expectedScale: 50 / 600 });
  assert.ok(result.detected, `confidence ${result.confidence}, priorDev ${result.priorDeviation}`);
  assert.ok(Math.abs(result.size - 50) < 1.5);
});

test("prior weighting picks the right peak when texture aliases", () => {
  // Real grid at 30 px plus a faint repeating texture at 18 px (lower than the
  // search floor would normally pick when running unbiased).
  const gray = makeSquareGrid(600, 600, 30, 5, 5, 1);
  for (let y = 0; y < 600; y++) {
    for (let x = 0; x < 600; x++) {
      if ((x % 18) === 0) gray[y * 600 + x] = Math.min(gray[y * 600 + x], 180);
    }
  }
  const result = detectGridFromGrayscale(gray, 600, 600, { expectedScale: 30 / 600 });
  assert.ok(result.detected, `confidence ${result.confidence}`);
  assert.ok(Math.abs(result.size - 30) < 1.5, `size ${result.size}`);
});
