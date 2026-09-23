import { REGION_DISPLAY_PATTERN_IDS } from "../../config/regionDisplayProfiles";
import logger from "../../lib/Logger";

/**
 * A drop-in replacement for Foundry's `HighlightRegionShader` that draws the region
 * highlight in one of several fill patterns instead of only the diagonal hatch.
 *
 * The class is built on first use: `foundry.canvas` does not exist while the module
 * bundle evaluates, nor in unit tests, and the base class is only reachable at runtime.
 * Before it is handed out it is checked against the core shader it extends and compiled
 * once on the live WebGL context; any failure leaves every region on the core shader.
 */

/** Uniforms the pattern shader adds to the core highlight shader's own. */
export const DDB_DISPLAY_UNIFORMS = {
  /** REGION_DISPLAY_PATTERN_IDS value. */
  pattern: 0,
  /** Pattern period in canvas pixels. */
  period: 12,
  /** Share of the period that is ink, 0-1. */
  thickness: 0.2,
  /** Gap alpha relative to the fill alpha. */
  gapOpacity: 0,
  /** Break stripes into dashes. */
  dashed: false,
  /** Dash-plus-gap length along a stripe, in canvas pixels. */
  dashPeriod: 50,
  /** Direction the stripes face, in radians; PI / 4 is Foundry's diagonal. */
  angle: Math.PI / 4,
  /** Clockwise rotation of each cross about its centre, in radians. */
  crossRotation: 0,
  /** Cross arm length multiplier, independent of arm width. */
  crossLength: 1,
  /** Wave amplitude and wavelength, measured in pattern periods. */
  waveAmplitude: 0.25,
  waveLength: 1,
  /** Shift of the pattern coordinates, in periods; 0.5 moves symbols from cell centres to cell corners. */
  patternOffset: 0,
} as const;

/**
 * Names the core shader sources must still carry. The vertex names are what core's
 * `_preRender` feeds and our vertex shader declares; the fragment names are the uniforms
 * core writes onto whichever shader the mesh holds (`hatchEnabled` from `_refreshState`).
 */
export const CORE_VERTEX_CONTRACT = [
  "aVertexPosition",
  "translationMatrix",
  "projectionMatrix",
  "canvasDimensions",
  "sceneDimensions",
  "screenDimensions",
] as const;
export const CORE_FRAGMENT_CONTRACT = ["tintAlpha", "resolution", "hatchEnabled"] as const;

/**
 * Vertex shader: the core one plus the pattern coordinates. They are computed here, where
 * precision is always high, and handed on as varyings already scaled into periods, the way
 * core computes its own hatch offset; a fragment stage that defaults to mediump then only
 * ever sees small numbers. Shared uniforms must use the fragment precision in both stages
 * or the program fails to link, even though vertex calculations stay high precision.
 */
export function buildVertexShader(precision: string, fragmentPrecision: string, constants: string): string {
  return `\
    precision ${precision} float;

    ${constants}

    attribute vec2 aVertexPosition;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;
    uniform vec2 canvasDimensions;
    uniform vec4 sceneDimensions;
    uniform vec2 screenDimensions;
    uniform ${fragmentPrecision} float period;
    uniform ${fragmentPrecision} float dashPeriod;
    uniform float angle;
    uniform float patternOffset;

    varying vec2 vCanvasCoord; // normalized canvas coordinates
    varying vec2 vSceneCoord; // normalized scene coordinates
    varying vec2 vScreenCoord; // normalized screen coordinates
    varying vec2 vStripe; // position across (x) and along (y) the first stripe set, in periods
    varying vec2 vDash; // position along the first (x) and second (y) stripe set, in dash periods
    varying vec2 vCell; // position in the dot grid, in periods

    void main() {
      vec2 pixelCoord = aVertexPosition;
      vCanvasCoord = pixelCoord / canvasDimensions;
      vSceneCoord = (pixelCoord - sceneDimensions.xy) / sceneDimensions.zw;
      vec3 tPos = translationMatrix * vec3(aVertexPosition, 1.0);
      vScreenCoord = tPos.xy / screenDimensions;
      gl_Position = vec4((projectionMatrix * tPos).xy, 0.0, 1.0);
      // n runs across the stripes (the period is measured along it) and t along them, which
      // is where the dashes go; the crosshatch's second set swaps the two
      vec2 n = vec2(cos(angle), sin(angle));
      vec2 t = vec2(-n.y, n.x);
      float safePeriod = max(period, 1.0);
      float safeDash = max(dashPeriod, 1.0);
      // the offset moves every pattern towards its origin by a share of the period, so 0.5
      // puts symbol centres and line centres on the grid lines instead of between them
      vStripe = vec2(dot(pixelCoord, n), dot(pixelCoord, t)) / safePeriod + patternOffset;
      vDash = vec2(dot(pixelCoord, t), dot(pixelCoord, n)) / safeDash;
      vCell = pixelCoord / safePeriod + patternOffset;
    }
  `;
}

/** The GLSL name of a pattern's id: `hollowDots` is `PATTERN_HOLLOW_DOTS`. */
export function patternDefineName(pattern: TRegionDisplayPattern): string {
  return `PATTERN_${pattern.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}`;
}

/**
 * One `#define` per fill pattern, generated from REGION_DISPLAY_PATTERN_IDS so the shader
 * branches on the same numbers `applyStyle` writes into the `pattern` uniform.
 */
export function patternDefines(): string {
  return Object.entries(REGION_DISPLAY_PATTERN_IDS)
    .map(([pattern, id]) => `#define ${patternDefineName(pattern as TRegionDisplayPattern)} ${id}`)
    .join("\n");
}

/**
 * Fragment shader. `hatchEnabled` is the core uniform Region#_refreshState clears while a
 * region is controlled, hovered or previewed; every pattern renders solid then, exactly as
 * the core shader does, so editing a region looks unchanged.
 */
export function buildFragmentShader(precision: string, constants: string): string {
  return `\
    precision ${precision} float;

    ${constants}

${patternDefines()}

    varying vec2 vStripe;
    varying vec2 vDash;
    varying vec2 vCell;

    uniform vec4 tintAlpha;
    uniform float resolution;
    uniform bool hatchEnabled;
    uniform int pattern;
    uniform ${precision} float period;
    uniform float thickness;
    uniform float gapOpacity;
    uniform float crossRotation;
    uniform float crossLength;
    uniform float waveAmplitude;
    uniform float waveLength;
    uniform bool dashed;
    uniform ${precision} float dashPeriod;

    // 1.0 inside the ink band around each stripe centre, 0.0 in the gap, with a one-pixel
    // anti-aliased edge. coord is measured in periods.
    float stripe(float coord, float aa) {
      float d = abs(fract(coord) - 0.5);
      return 1.0 - smoothstep(thickness * 0.5 - aa, thickness * 0.5 + aa, d);
    }

    // 1.0 for a dash centred on each period boundary along the stripe, 0.0 for the gap
    float dash(float along, float aa) {
      if ( !dashed ) return 1.0;
      float d = abs(fract(along) - 0.5);
      return smoothstep(0.25 - aa, 0.25 + aa, d);
    }

    float crossDistance(vec2 cell, float radius, float arm) {
      cell = abs(cell);
      return min(max(cell.x - radius, cell.y - arm), max(cell.x - arm, cell.y - radius));
    }

    void main() {
      gl_FragColor = tintAlpha;
      if ( !hatchEnabled ) return;
      if ( pattern == PATTERN_SOLID || pattern == PATTERN_EDGE ) return;
      float safePeriod = max(period, 1.0);
      float aa = 1.0 / max(safePeriod * resolution, 1.0);
      float ink = 0.0;
      if ( pattern == PATTERN_DOTS || pattern == PATTERN_HOLLOW_DOTS || pattern == PATTERN_DIAMONDS ) {
        vec2 cell = fract(vCell) - 0.5;
        float radius = thickness * 0.5;
        float dist = pattern == PATTERN_DIAMONDS ? abs(cell.x) + abs(cell.y) : length(cell);
        ink = 1.0 - smoothstep(radius - aa, radius + aa, dist);
        if ( pattern == PATTERN_HOLLOW_DOTS ) ink *= smoothstep(radius * 0.6 - aa, radius * 0.6 + aa, dist);
      } else if ( pattern == PATTERN_CROSSES ) {
        vec2 axisX = vec2(cos(crossRotation), -sin(crossRotation));
        vec2 axisY = vec2(-axisX.y, axisX.x);
        vec2 cell = mat2(axisX, axisY) * (fract(vCell) - 0.5);
        float radius = thickness * 0.5 * crossLength;
        float arm = thickness / 6.0;
        float dist = crossDistance(cell, radius, arm);
        // Long, rotated arms can reach diagonal cells and cells two steps away.
        // The supported length (at most three periods) fits within this neighbourhood.
        for ( int x = -2; x <= 2; x++ ) {
          for ( int y = -2; y <= 2; y++ ) {
            dist = min(dist, crossDistance(cell + float(x) * axisX + float(y) * axisY, radius, arm));
          }
        }
        ink = 1.0 - smoothstep(-aa, aa, dist);
      } else if ( pattern == PATTERN_CHECKERBOARD ) {
        // Each period is one square. Fade parity towards the shared edge to anti-alias
        // neighbouring squares without seams, including where four squares meet.
        vec2 cell = fract(vCell);
        vec2 edge = min(cell, 1.0 - cell);
        vec2 parity = (1.0 - 2.0 * mod(floor(vCell), 2.0)) * smoothstep(vec2(0.0), vec2(aa), edge);
        ink = 0.5 + 0.5 * parity.x * parity.y;
      } else {
        float dashAa = aa * safePeriod / max(dashPeriod, 1.0);
        if ( pattern == PATTERN_WAVES || pattern == PATTERN_CHEVRONS ) {
          // Wavelength scales only the along-line coordinate, leaving band spacing and
          // dash length independent. Slope keeps anti-aliasing tied to screen pixels.
          float wavelength = pattern == PATTERN_WAVES ? max(waveLength, 0.25) : 1.0;
          float phase = fract(vStripe.y / wavelength);
          float offset = pattern == PATTERN_WAVES ? waveAmplitude * sin(phase * 6.28318530718) : abs(phase - 0.5) - 0.25;
          float slope = pattern == PATTERN_WAVES ? waveAmplitude * 6.28318530718 / wavelength * cos(phase * 6.28318530718) : 1.0;
          ink = thickness >= 1.0 ? 1.0 : stripe(vStripe.x - offset, aa * sqrt(1.0 + slope * slope));
          ink *= dash(vDash.x, dashAa);
        } else {
          ink = stripe(vStripe.x, aa) * dash(vDash.x, dashAa);
        }
        if ( pattern == PATTERN_CROSSHATCH ) ink = max(ink, stripe(vStripe.y, aa) * dash(vDash.y, dashAa));
      }
      gl_FragColor *= mix(gapOpacity, 1.0, ink);
    }
  `;
}

/** The subset of WebGLRenderingContext the compile check uses, so tests can fake it. */
export interface IShaderCompileContext {
  VERTEX_SHADER: number;
  FRAGMENT_SHADER: number;
  COMPILE_STATUS: number;
  LINK_STATUS: number;
  createShader(type: number): unknown;
  shaderSource(shader: unknown, source: string): void;
  compileShader(shader: unknown): void;
  getShaderParameter(shader: unknown, name: number): unknown;
  getShaderInfoLog(shader: unknown): string | null;
  createProgram(): unknown;
  attachShader(program: unknown, shader: unknown): void;
  linkProgram(program: unknown): void;
  getProgramParameter(program: unknown, name: number): unknown;
  getProgramInfoLog(program: unknown): string | null;
  deleteShader(shader: unknown): void;
  deleteProgram(program: unknown): void;
}

/**
 * Compile and link a vertex / fragment pair on a context, then throw it away. PIXI compiles
 * lazily at first render, so this is the only way to learn before a region is drawn that a
 * Foundry or driver change broke the program.
 */
export function verifyShaderProgram(
  gl: IShaderCompileContext,
  vertex: string,
  fragment: string,
): { ok: boolean; error?: string } {
  const objects: { shaders: unknown[]; program: unknown } = { shaders: [], program: null };
  try {
    const compile = (type: number, source: string, label: string): unknown => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error(`could not create the ${label} shader`);
      objects.shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`${label} shader failed to compile: ${gl.getShaderInfoLog(shader) ?? "no log"}`);
      }
      return shader;
    };
    const vert = compile(gl.VERTEX_SHADER, vertex, "vertex");
    const frag = compile(gl.FRAGMENT_SHADER, fragment, "fragment");
    const program = gl.createProgram();
    if (!program) throw new Error("could not create the program");
    objects.program = program;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`program failed to link: ${gl.getProgramInfoLog(program) ?? "no log"}`);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    for (const shader of objects.shaders) gl.deleteShader(shader);
    if (objects.program) gl.deleteProgram(objects.program);
  }
}

/** The names from a contract that a shader source no longer mentions. */
export function missingContractNames(source: string, contract: readonly string[]): string[] {
  return contract.filter((name) => !source.includes(name));
}

/** The core `HighlightRegionShader`, or null outside a Foundry client. */
export function getCoreHighlightShaderClass(): TCoreShaderClass | null {
  const shaders = (globalThis as { foundry?: { canvas?: { rendering?: { shaders?: Record<string, unknown> } } } })
    .foundry?.canvas?.rendering?.shaders;
  const cls = shaders?.["HighlightRegionShader"];
  return typeof cls === "function" ? (cls as unknown as TCoreShaderClass) : null;
}

/** The live WebGL context, when a canvas renderer exists. */
function liveContext(): IShaderCompileContext | null {
  const gl = (globalThis as { canvas?: { app?: { renderer?: { gl?: IShaderCompileContext } } } }).canvas?.app?.renderer
    ?.gl;
  return gl ?? null;
}

let cached: TCoreShaderClass | null = null;

/** Set once the class was checked and found unusable; every later call keeps the core shader. */
let unavailable = false;

/** For tests: forget the cached class and any recorded failure. */
export function resetDDBDisplayShaderClass(): void {
  cached = null;
  unavailable = false;
}

/**
 * Build (once) and return the pattern shader class, or null when Foundry's canvas is not
 * loaded or the class failed its checks: the core sources must still carry the names we
 * depend on, and the program must compile and link on the live context.
 */
export function getDDBDisplayShaderClass({
  gl = liveContext(),
}: { gl?: IShaderCompileContext | null } = {}): TCoreShaderClass | null {
  if (cached) return cached;
  if (unavailable) return null;
  const core = getCoreHighlightShaderClass();
  if (!core) return null;
  // a const the class body can close over without losing the null narrowing
  const Base: TCoreShaderClass = core;

  const missing = [
    ...missingContractNames(Base._createVertexShader(), CORE_VERTEX_CONTRACT),
    ...missingContractNames(Base._createFragmentShader(), CORE_FRAGMENT_CONTRACT),
  ];
  if (missing.length > 0) {
    unavailable = true;
    logger.warn(
      "Region display profiles disabled: Foundry's HighlightRegionShader no longer declares " +
        `${missing.join(", ")}; regions keep the core highlight until the module is updated`,
    );
    return null;
  }

  const vertexPrecision = String(PIXI.Program.defaultVertexPrecision);
  const fragmentPrecision = String(PIXI.Program.defaultFragmentPrecision);
  const vertex = buildVertexShader(vertexPrecision, fragmentPrecision, Base.CONSTANTS);
  const fragment = buildFragmentShader(fragmentPrecision, Base.CONSTANTS);
  if (gl) {
    const result = verifyShaderProgram(gl, vertex, fragment);
    if (!result.ok) {
      unavailable = true;
      logger.warn(
        `Region display profiles disabled: the pattern shader did not compile (${result.error}); ` +
          "regions keep the core highlight",
      );
      return null;
    }
  }

  class DDBRegionDisplayShader extends Base {
    static override defaultUniforms = {
      ...Base.defaultUniforms,
      ...DDB_DISPLAY_UNIFORMS,
    };

    static override _createVertexShader(): string {
      return vertex;
    }

    static override _createFragmentShader(): string {
      return fragment;
    }
  }

  cached = DDBRegionDisplayShader as unknown as TCoreShaderClass;
  return cached;
}
