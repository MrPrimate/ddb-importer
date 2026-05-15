// Auto-detect a printed square grid in a battle-map image.
//
// Pipeline:
//   1. Downscale image to a manageable resolution.
//   2. Build per-column / per-row edge-strength projections (1D Sobel).
//   3. Autocorrelate each projection, prior-constrained by tokenScale.
//   4. Refine the peak lag to sub-pixel via parabolic fit.
//   5. Find the offset (phase) that maximises the projection at multiples of the
//      detected period.
//   6. Confidence = peak prominence above local median; rejection on low score
//      or if X/Y periods disagree wildly.


interface IPeakResult {
  lag: number;
  rawLag: number;
  peakValue: number;
  confidence: number;
  boundaryLocked: boolean;
}

function buildProjections(gray: Float32Array, width: number, height: number) {
  // 1D Laplacian-style "line response" filters with distance-2 sampling. For a
  // dark line at column x, the response 2*gray[x] - gray[x-2] - gray[x+2] is
  // strongly negative; we take |response| so vertical and horizontal grid lines
  // project cleanly onto colProj[x] and rowProj[y] respectively.
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

function autocorrelate(signal: Float32Array, lagMin: number, lagMax: number): Float32Array {
  const n = signal.length;
  const ac = new Float32Array(lagMax + 1);
  let mean = 0;
  for (let i = 0; i < n; i++) mean += signal[i];
  mean /= n;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    const limit = n - lag;
    if (limit <= 0) {
      ac[lag] = 0;
      continue;
    }
    let sum = 0;
    for (let i = 0; i < limit; i++) {
      sum += (signal[i] - mean) * (signal[i + lag] - mean);
    }
    ac[lag] = sum / limit;
  }
  return ac;
}

function findPeak(ac: Float32Array, lagMin: number, lagMax: number, expectedLag: number | null = null): IPeakResult {
  // When a prior is supplied, multiply autocorrelation by a Gaussian centred on
  // the expected lag so the search anchors near the prior instead of getting
  // hijacked by texture-induced peaks at the search-band boundary.
  const useWeight = expectedLag !== null && expectedLag > 0;
  const sigma = useWeight ? Math.max(3, expectedLag * 0.15) : 1;

  let peakLag = lagMin;
  let peakWeighted = -Infinity;
  let peakRaw = -Infinity;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let weight = 1;
    if (useWeight) {
      const z = (lag - (expectedLag as number)) / sigma;
      weight = Math.exp(-0.5 * z * z);
    }
    const v = ac[lag] * weight;
    if (v > peakWeighted) {
      peakWeighted = v;
      peakRaw = ac[lag];
      peakLag = lag;
    }
  }

  // Without a prior, fall back to harmonic suppression: prefer fundamental over
  // its multiples when the smaller lag still has comparable autocorrelation.
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

  // Sub-pixel parabolic fit
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

// Template-based detection: directly score the hypothesis "if a grid exists at
// period W and phase P, the projection should be high at positions P, P+W,
// P+2W, ... ". Unlike autocorrelation this can't be fooled by harmonics - at
// W = 2×true, half the painted lines are skipped and the score drops.
function templateScan(
  signal: Float32Array,
  sizeMin: number,
  sizeMax: number,
  sizeStep: number,
): { size: number; offset: number; score: number } {
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
      // Normalise by number of samples so longer periods (fewer samples) don't
      // get penalised relative to shorter periods.
      const normalised = count > 0 ? sum / count : 0;
      if (normalised > phaseBestScore) {
        phaseBestScore = normalised;
        phaseBest = P;
      }
    }
    if (phaseBestScore > bestScore) {
      bestScore = phaseBestScore;
      bestW = W;
      bestP = phaseBest;
    }
  }
  return { size: bestW, offset: bestP, score: bestScore };
}

function findPhase(signal: Float32Array, period: number): number {
  const periodInt = Math.round(period);
  if (periodInt < 2) return 0;
  let bestPhase = 0;
  let bestScore = -Infinity;
  const n = signal.length;
  for (let phase = 0; phase < periodInt; phase++) {
    let score = 0;
    for (let k = 0; phase + k * periodInt < n; k++) {
      score += signal[phase + k * periodInt];
    }
    if (score > bestScore) {
      bestScore = score;
      bestPhase = phase;
    }
  }
  return bestPhase;
}

function extractTile(gray: Float32Array, fullW: number, x: number, y: number, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let dy = 0; dy < h; dy++) {
    const srcRow = (y + dy) * fullW + x;
    out.set(gray.subarray(srcRow, srcRow + w), dy * w);
  }
  return out;
}

function detectGridViaRegions(
  gray: Float32Array,
  width: number,
  height: number,
  expected: number | null,
  options: IGridDetectorOptions,
): IGridDetectionResult | null {
  // 3×3 tile grid. Each tile gets the same absolute prior, computed against
  // the FULL image size, so the search band per tile is identical regardless
  // of tile position.
  const tileCount = 3;
  const tileW = Math.floor(width / tileCount);
  const tileH = Math.floor(height / tileCount);
  if (tileW < 200 || tileH < 200) return null;

  const tileResults: { result: IGridDetectionResult; tileX: number; tileY: number }[] = [];
  for (let ty = 0; ty < tileCount; ty++) {
    for (let tx = 0; tx < tileCount; tx++) {
      const x0 = tx * tileW;
      const y0 = ty * tileH;
      const tile = extractTile(gray, width, x0, y0, tileW, tileH);
      const tileOpts: IGridDetectorOptions = {
        ...options,
        // Pass the absolute expected size as a fraction of the tile width so
        // tile detection uses the same prior in pixel units.
        expectedScale: expected ? expected / tileW : undefined,
        // Loosen rejection thresholds inside tiles; we rely on the consensus
        // across tiles, not any single tile's confidence.
        confidenceThreshold: 0.05,
      };
      const result = detectGridFromGrayscaleSingle(tile, tileW, tileH, tileOpts);
      tileResults.push({ result, tileX: x0, tileY: y0 });
    }
  }

  const consistent = tileResults.filter(({ result }) => {
    if (result.size <= 0) return false;
    if (result.diagnostics?.sizeX === result.diagnostics?.sizeY && result.size === 0) return false;
    if (expected !== null) {
      const dev = Math.abs(result.size - expected) / expected;
      if (dev > 0.15) return false;
    }
    return result.confidence > 0.05;
  });

  // Require at least a third of tiles to agree. For 9 tiles that's 3 - enough
  // to recover even when the grid is only legible in a strip of the image.
  const minAgreeing = Math.max(3, Math.ceil(tileResults.length / 3));
  if (consistent.length < minAgreeing) return null;

  const sizes = consistent.map((c) => c.result.size).sort((a, b) => a - b);
  const medianSize = sizes[Math.floor(sizes.length / 2)];
  const period = Math.round(medianSize);
  if (period < 1) return null;

  // Convert each tile's offset to global-image-pixel coords, modulo period.
  const wrap = (v: number) => ((v % period) + period) % period;
  const globalX = consistent.map((c) => wrap(c.tileX + c.result.offsetX));
  const globalY = consistent.map((c) => wrap(c.tileY + c.result.offsetY));
  const sortedX = [...globalX].sort((a, b) => a - b);
  const sortedY = [...globalY].sort((a, b) => a - b);
  const medianOffsetX = sortedX[Math.floor(sortedX.length / 2)];
  const medianOffsetY = sortedY[Math.floor(sortedY.length / 2)];

  const meanConfidence = consistent.reduce((s, c) => s + c.result.confidence, 0) / consistent.length;
  const agreementRatio = consistent.length / tileResults.length;
  const confidence = Math.min(1, meanConfidence + agreementRatio * 0.15);

  return {
    detected: true,
    size: medianSize,
    offsetX: medianOffsetX,
    offsetY: medianOffsetY,
    confidence,
    diagnostics: {
      sizeX: medianSize,
      sizeY: medianSize,
      confidenceX: meanConfidence,
      confidenceY: meanConfidence,
      width,
      height,
      scaleFactor: 1,
      expectedSize: expected,
      lagMin: 0,
      lagMax: 0,
    },
  };
}

export function detectGridFromGrayscale(
  gray: Float32Array,
  width: number,
  height: number,
  options: IGridDetectorOptions = {},
): IGridDetectionResult {
  const direct = detectGridFromGrayscaleSingle(gray, width, height, options);
  if (direct.detected) return direct;

  // Fall back to region voting only when the image is large enough for tiles
  // to be useful and we have a prior to anchor each tile's search band.
  if (width >= 600 && height >= 600 && options.expectedScale) {
    const expected = options.expectedScale > 0 && options.expectedScale < 1
      ? options.expectedScale * width
      : null;
    const regional = detectGridViaRegions(gray, width, height, expected, options);
    if (regional?.detected) {
      // Carry over the single-pass template/prior fields so callers can see
      // every candidate side-by-side even when regional voting wins.
      return {
        ...regional,
        priorOffsetX: regional.priorOffsetX ?? direct.priorOffsetX ?? null,
        priorOffsetY: regional.priorOffsetY ?? direct.priorOffsetY ?? null,
        priorSize: regional.priorSize ?? direct.priorSize ?? null,
        templateSize: regional.templateSize ?? direct.templateSize ?? null,
        templateOffsetX: regional.templateOffsetX ?? direct.templateOffsetX ?? null,
        templateOffsetY: regional.templateOffsetY ?? direct.templateOffsetY ?? null,
        templateScore: regional.templateScore ?? direct.templateScore ?? null,
      };
    }
  }
  return direct;
}

function detectGridFromGrayscaleSingle(
  gray: Float32Array,
  width: number,
  height: number,
  options: IGridDetectorOptions,
): IGridDetectionResult {
  const minDim = Math.min(width, height);
  const absoluteMaxLag = Math.max(20, Math.floor(minDim / 4));
  const padFrac = options.searchPaddingFraction ?? 0.5;

  const expected = options.expectedScale && options.expectedScale > 0 && options.expectedScale < 1
    ? options.expectedScale * width
    : null;

  const lagMin = expected
    ? Math.max(20, Math.floor(expected * (1 - padFrac)))
    : 20;
  const lagMax = expected
    ? Math.min(absoluteMaxLag, Math.ceil(expected * (1 + padFrac)))
    : absoluteMaxLag;

  if (lagMax <= lagMin + 1) {
    return {
      detected: false,
      size: expected ?? 0,
      offsetX: 0,
      offsetY: 0,
      confidence: 0,
      diagnostics: {
        sizeX: 0, sizeY: 0,
        confidenceX: 0, confidenceY: 0,
        width, height,
        scaleFactor: 1,
        expectedSize: expected,
        lagMin, lagMax,
      },
    };
  }

  const { colProj, rowProj } = buildProjections(gray, width, height);

  // Trim the outer fraction of each projection. Decorative parchment frames
  // around battle maps create huge gradient spikes near the edges that swamp
  // the painted-grid periodicity. Cropping the 1D signal lets autocorrelation
  // and template scan see only the inner region where the grid lives.
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
  // findPhase returns phase in inner-projection coords. Add the trim back so
  // offset is in original-image coords. Modulo the rounded period keeps it in
  // [0, period).
  const phaseToImage = (phase: number, period: number, trim: number) => {
    const p = Math.max(1, Math.round(period));
    return ((phase + trim) % p + p) % p;
  };
  const offsetX = phaseToImage(findPhase(colProjInner, sizeX), sizeX, trimX);
  const offsetY = phaseToImage(findPhase(rowProjInner, sizeY), sizeY, trimY);

  const priorOffsetX = expected !== null
    ? phaseToImage(findPhase(colProjInner, expected), expected, trimX)
    : null;
  const priorOffsetY = expected !== null
    ? phaseToImage(findPhase(rowProjInner, expected), expected, trimY)
    : null;

  let templateSize: number | null = null;
  let templateOffsetX: number | null = null;
  let templateOffsetY: number | null = null;
  let templateScore: number | null = null;
  // When DDB hasn't supplied a prior, bootstrap the template anchor from
  // the autocorrelation peak. Template scan locks onto actual painted lines
  // so even a noisy autocorrelation estimate gives template a useful seed
  // and surfaces a second candidate for the user to compare against.
  const sizesAgree = sizeX > 0 && sizeY > 0
    && Math.abs(sizeX - sizeY) / Math.min(sizeX, sizeY) <= 0.05;
  const autocorrAnchor = sizesAgree
    ? (sizeX + sizeY) / 2
    : (sizeX > 0 ? sizeX : null);
  const templateAnchor = expected ?? autocorrAnchor;
  if (templateAnchor !== null && templateAnchor >= 4) {
    // Wider search band when bootstrapping from autocorrelation - we have
    // less confidence in the seed than in a DDB-supplied prior.
    const widen = expected !== null ? 0.15 : 0.30;
    const tMin = Math.max(2, templateAnchor * (1 - widen));
    const tMax = templateAnchor * (1 + widen);
    const tStep = 0.1;
    const templateX = templateScan(colProjInner, tMin, tMax, tStep);
    const templateY = templateScan(rowProjInner, tMin, tMax, tStep);
    const tDev = templateY.size > 0 ? Math.abs(templateX.size - templateY.size) / Math.min(templateX.size, templateY.size) : Infinity;
    if (tDev <= 0.03) {
      templateSize = (templateX.size + templateY.size) / 2;
    } else {
      templateSize = templateX.size;
    }
    templateOffsetX = phaseToImage(templateX.offset, templateX.size, trimX);
    templateOffsetY = phaseToImage(templateY.offset, templateY.size, trimY);
    templateScore = Math.min(templateX.score, templateY.score);
  }

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
  // Adaptive threshold: when the prior strongly agrees with the detected size,
  // accept lower peak prominence as evidence of correctness. Low-contrast or
  // textured maps often have a real peak that's barely above the noise floor.
  const priorAgrees = expected !== null && priorDeviation < 0.10;
  const effectiveThreshold = priorAgrees ? Math.min(threshold, 0.08) : threshold;
  const detected = confidence >= effectiveThreshold && squareOk && !boundaryLocked && !tooFarFromPrior;

  return {
    detected,
    size,
    offsetX,
    offsetY,
    confidence,
    priorOffsetX,
    priorOffsetY,
    priorSize: expected,
    templateSize,
    templateOffsetX,
    templateOffsetY,
    templateScore,
    diagnostics: {
      sizeX, sizeY,
      confidenceX: peakX.confidence,
      confidenceY: peakY.confidence,
      width, height,
      scaleFactor: 1,
      expectedSize: expected,
      lagMin, lagMax,
    },
  };
}

export async function detectGrid(
  blob: Blob,
  options: IGridDetectorOptions = {},
): Promise<IGridDetectionResult> {
  // Default 4096 keeps virtually all DDB battle maps (largest seen ~3300 px)
  // at native resolution, so phase detection has full pixel precision.
  // Downsampling only kicks in for unusually huge user-uploaded maps.
  const targetMaxSide = options.targetMaxSide ?? 4096;
  const bitmap = await createImageBitmap(blob);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > targetMaxSide ? targetMaxSide / longest : 1;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  let imageData: ImageData;
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("GridDetector: could not acquire 2d context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    imageData = ctx.getImageData(0, 0, w, h);
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("GridDetector: could not acquire 2d context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    imageData = ctx.getImageData(0, 0, w, h);
  }
  if (typeof bitmap.close === "function") bitmap.close();

  const gray = new Float32Array(w * h);
  const { data } = imageData;
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }

  const result = detectGridFromGrayscale(gray, w, h, options);
  const scaleFactor = scale === 0 ? 1 : 1 / scale;
  return {
    ...result,
    size: result.size * scaleFactor,
    offsetX: result.offsetX * scaleFactor,
    offsetY: result.offsetY * scaleFactor,
    priorOffsetX: result.priorOffsetX !== null && result.priorOffsetX !== undefined ? result.priorOffsetX * scaleFactor : result.priorOffsetX,
    priorOffsetY: result.priorOffsetY !== null && result.priorOffsetY !== undefined ? result.priorOffsetY * scaleFactor : result.priorOffsetY,
    priorSize: result.priorSize !== null && result.priorSize !== undefined ? result.priorSize * scaleFactor : result.priorSize,
    templateSize: result.templateSize !== null && result.templateSize !== undefined ? result.templateSize * scaleFactor : result.templateSize,
    templateOffsetX: result.templateOffsetX !== null && result.templateOffsetX !== undefined ? result.templateOffsetX * scaleFactor : result.templateOffsetX,
    templateOffsetY: result.templateOffsetY !== null && result.templateOffsetY !== undefined ? result.templateOffsetY * scaleFactor : result.templateOffsetY,
    diagnostics: result.diagnostics
      ? { ...result.diagnostics, scaleFactor }
      : undefined,
  };
}
