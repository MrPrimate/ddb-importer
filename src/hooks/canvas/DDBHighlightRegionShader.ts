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
export const DDB_HIGHLIGHT_UNIFORMS = {
  /** REGION_HIGHLIGHT_PATTERN_IDS value. */
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
      vStripe = vec2(dot(pixelCoord, n), dot(pixelCoord, t)) / safePeriod;
      vDash = vec2(dot(pixelCoord, t), dot(pixelCoord, n)) / safeDash;
      vCell = pixelCoord / safePeriod;
    }
  `;
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
    uniform bool dashed;
    uniform ${precision} float dashPeriod;

    // 1.0 inside the ink band around each stripe centre, 0.0 in the gap, with a one-pixel
    // anti-aliased edge. coord is measured in periods.
    float stripe(float coord, float aa) {
      float d = abs(fract(coord) - 0.5);
      return 1.0 - smoothstep(thickness * 0.5 - aa, thickness * 0.5 + aa, d);
    }

    // 1.0 for the first half of each dash period along the stripe, 0.0 for the gap
    float dash(float along, float aa) {
      if ( !dashed ) return 1.0;
      float d = abs(fract(along) - 0.5);
      return smoothstep(0.25 - aa, 0.25 + aa, d);
    }

    void main() {
      gl_FragColor = tintAlpha;
      if ( !hatchEnabled ) return;
      if ( pattern == 1 || pattern == 4 ) return;
      float safePeriod = max(period, 1.0);
      float aa = 1.0 / max(safePeriod * resolution, 1.0);
      float ink = 0.0;
      if ( pattern == 3 || pattern == 5 || pattern == 6 ) {
        vec2 cell = fract(vCell) - 0.5;
        float radius = thickness * 0.5;
        float dist = pattern == 6 ? abs(cell.x) + abs(cell.y) : length(cell);
        ink = 1.0 - smoothstep(radius - aa, radius + aa, dist);
        if ( pattern == 5 ) ink *= smoothstep(radius * 0.6 - aa, radius * 0.6 + aa, dist);
      } else {
        float dashAa = aa * safePeriod / max(dashPeriod, 1.0);
        ink = stripe(vStripe.x, aa) * dash(vDash.x, dashAa);
        if ( pattern == 2 ) ink = max(ink, stripe(vStripe.y, aa) * dash(vDash.y, dashAa));
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
export function resetDDBHighlightShaderClass(): void {
  cached = null;
  unavailable = false;
}

/**
 * Build (once) and return the pattern shader class, or null when Foundry's canvas is not
 * loaded or the class failed its checks: the core sources must still carry the names we
 * depend on, and the program must compile and link on the live context.
 */
export function getDDBHighlightShaderClass({
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
      "Region highlight profiles disabled: Foundry's HighlightRegionShader no longer declares " +
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
        `Region highlight profiles disabled: the pattern shader did not compile (${result.error}); ` +
          "regions keep the core highlight",
      );
      return null;
    }
  }

  class DDBHighlightRegionShader extends Base {
    static override defaultUniforms = {
      ...Base.defaultUniforms,
      ...DDB_HIGHLIGHT_UNIFORMS,
    };

    static override _createVertexShader(): string {
      return vertex;
    }

    static override _createFragmentShader(): string {
      return fragment;
    }
  }

  cached = DDBHighlightRegionShader as unknown as TCoreShaderClass;
  return cached;
}
