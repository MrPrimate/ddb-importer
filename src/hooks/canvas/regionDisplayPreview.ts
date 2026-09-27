import { isImagePattern, REGION_DISPLAY_FALLBACK_COLOR } from "../../config/regionDisplayProfiles";

/**
 * A CSS approximation of a display style, for swatches in the profile editor and the
 * Region config. The canvas shader is the truth; this only has to read the same way.
 */

/**
 * `#rrggbb` / `#rgb` to `rgba()`. The result is written into a `style` attribute, so any other
 * string is replaced by the fallback colour rather than passed through as CSS.
 */
export function rgba(color: string, alpha: number): string {
  const hex = String(color ?? "").trim().replace(/^#/, "");
  const short = (/^[0-9a-f]{3}$/i).test(hex);
  if (!short && !(/^[0-9a-f]{6}$/i).test(hex)) return rgba(REGION_DISPLAY_FALLBACK_COLOR, alpha);
  const full = short
    ? hex
      .split("")
      .map((c) => c + c)
      .join("")
    : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type TPreviewStyle = Pick<
  IRegionDisplayProfile,
  "pattern" | "opacity" | "gapOpacity" | "borderOpacity" | "spacing" | "thickness" | "edgeWidth" | "color"
> &
  Partial<
    Pick<
      IRegionDisplayStyle,
      | "textureFit"
      | "textureSrc"
      | "textureColorMode"
      | "textureAnchor"
      | "dashed"
      | "dashLength"
      | "angle"
      | "crossRotation"
      | "crossLength"
      | "waveAmplitude"
      | "waveLength"
      | "offset"
      | "border"
      | "borderWidth"
    >
  >;

/** Escape colours before embedding them in an SVG attribute. */
function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Rotating the SVG pattern, rather than a rectangular background tile, keeps arbitrary
 * angles seamless. Across/along coordinates match the shader; band width is measured
 * across the overall line direction, and dashes along it, including through bends.
 */
function curvedLinesSvg(style: TPreviewStyle, ink: string, gap: string, period: number, grid: number, offsetPx: number): string {
  const steps = style.pattern === "waves" ? 64 : 2;
  const amplitude = style.waveAmplitude ?? 0.25;
  const wavelength = style.pattern === "waves" ? (style.waveLength ?? 1) : 1;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const phase = i / steps;
    const offset = style.pattern === "waves" ? amplitude * Math.sin(phase * Math.PI * 2) : Math.abs(phase - 0.5) - 0.25;
    return { x: (0.5 + offset) * 100, y: phase * 100 };
  });
  const halfWidth = style.thickness * 50;
  const edge = (point: { x: number; y: number }, side: number) =>
    `${Number((point.x + side * halfWidth).toFixed(3))} ${point.y}`;
  const outline = [...points.map((point) => edge(point, -1)), ...[...points].reverse().map((point) => edge(point, 1))];
  const angle = style.angle ?? 45;
  const dash = Math.max(1, (style.dashLength ?? 0.25) * grid);
  const mask = style.dashed
    ? `<pattern id="dashes" width="1" height="${dash * 2}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><g fill="white"><rect width="1" height="${dash / 2}"/><rect y="${dash * 1.5}" width="1" height="${dash / 2}"/></g></pattern><mask id="dash-mask"><rect width="100%" height="100%" fill="url(#dashes)"/></mask>`
    : "";
  const bands = style.thickness >= 1
    ? "<rect width=\"100\" height=\"100\"/>"
    : "<use href=\"#band\" x=\"-100\"/><use href=\"#band\"/><use href=\"#band\" x=\"100\"/>";
  // Adjacent bands cover the tile boundaries at larger thicknesses, including a solid
  // fill at full thickness. The gap lies behind the ink, so dashes retain gap opacity.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><path id="band" d="M${outline.join(" L")}Z"/><pattern id="lines" width="${period}" height="${period * wavelength}" patternUnits="userSpaceOnUse" viewBox="0 0 100 100" preserveAspectRatio="none" patternTransform="rotate(${angle}) translate(${-offsetPx} ${-offsetPx})"><g fill="${escapeAttribute(ink)}">${bands}</g></pattern>${mask}</defs><rect width="100%" height="100%" fill="${escapeAttribute(gap)}"/><rect width="100%" height="100%" fill="url(#lines)"${style.dashed ? " mask=\"url(#dash-mask)\"" : ""}/></svg>`;
}

/**
 * Inline CSS declarations for a swatch. `regionColor` stands in for the region's own colour
 * when the style has none; `grid` is the swatch's pixel size of one grid square.
 *
 * The inner fill element composites the gap and ink before applying fill opacity. Its
 * pseudo-elements mask dashed ink. The outer element paints the independently opaque border.
 */
export function previewCss(style: TPreviewStyle, regionColor: string, grid = 50): string {
  const color = style.color || regionColor;
  if (isImagePattern(style.pattern)) {
    return previewCss({ ...style, pattern: "hatch", dashed: false }, regionColor, grid);
  }
  const ink = rgba(color, 1);
  const gap = rgba(color, style.gapOpacity);
  const period = Math.max(1, style.spacing * grid);
  const thickness = Math.max(0.5, style.thickness * period);
  // the pattern offset moves everything towards the origin by a share of the period
  const offsetPx = (style.offset ?? 0) * period;
  const declarations: string[] = [`--ddbi-fill-opacity: ${style.opacity}`];
  // Curved bands already apply offset inside their rotated SVG coordinate system.
  if (offsetPx && style.pattern !== "waves" && style.pattern !== "chevrons") {
    declarations.push(`--ddbi-background-position: ${-offsetPx}px ${-offsetPx}px`);
  }
  // a CSS gradient angle points across its stripes and 0deg points up, while the shader's
  // angle is the across-stripe direction with 0 pointing right, so the gradient is angle + 90
  const across = (style.angle ?? 45) + 90;
  const along = style.angle ?? 45;
  // the shader centres each line in its period, so the ink starts half a period in, less half
  // its own width and the offset; a repeating gradient may start at a negative position
  const stripeStart = period / 2 - thickness / 2 - offsetPx;
  const px = (value: number) => `${Number(value.toFixed(3))}px`;
  const stripes = (angle: number, rest: string) =>
    `repeating-linear-gradient(${angle}deg, ${ink} ${px(stripeStart)} ${px(stripeStart + thickness)}, ${rest} ${px(stripeStart + thickness)} ${px(stripeStart + period)})`;
  if (style.border || style.pattern === "edge") {
    const width = Math.max(1, (style.pattern === "edge" ? style.edgeWidth : (style.borderWidth ?? 0.1)) * grid);
    declarations.push(
      `--ddbi-border-width: ${width}px`,
      `--ddbi-border-color: ${rgba(color, style.borderOpacity ?? style.opacity)}`,
    );
  }
  const dashedLines = style.dashed === true && (style.pattern === "hatch" || style.pattern === "crosshatch");
  if (dashedLines) {
    const dash = Math.max(1, (style.dashLength ?? 0.25) * grid);
    const dashes = (angle: number) =>
      `repeating-linear-gradient(${angle}deg, black ${px(-dash / 2)} ${px(dash / 2)}, transparent ${px(dash / 2)} ${px(dash * 1.5)})`;
    declarations.push(
      `--ddbi-background: ${gap}`,
      `--ddbi-ink: ${stripes(across, "transparent")}`,
      `--ddbi-mask: ${dashes(along)}`,
    );
    if (style.pattern === "crosshatch") {
      declarations.push(`--ddbi-ink2: ${stripes(across + 90, "transparent")}`, `--ddbi-mask2: ${dashes(along + 90)}`);
    }
    return declarations.join("; ");
  }
  switch (style.pattern) {
    case "waves":
    case "chevrons":
      declarations.push(
        `--ddbi-background: url("data:image/svg+xml,${encodeURIComponent(curvedLinesSvg(style, ink, gap, period, grid, offsetPx))}")`,
        "--ddbi-background-size: 100% 100%",
      );
      break;
    case "solid":
      declarations.push(`--ddbi-background: ${ink}`);
      break;
    case "crosshatch":
      declarations.push(`--ddbi-background: ${stripes(across, "transparent")}, ${stripes(across + 90, gap)}`);
      break;
    case "dots":
    case "hollowDots": {
      const hole =
        style.pattern === "hollowDots" ? `${gap} ${thickness * 0.3}px, ${ink} ${thickness * 0.3 + 0.5}px, ` : "";
      declarations.push(
        `--ddbi-background: radial-gradient(circle, ${hole}${ink} ${thickness / 2}px, ${gap} ${thickness / 2 + 0.5}px)`,
        `--ddbi-background-size: ${period}px ${period}px`,
      );
      break;
    }
    case "diamonds":
    case "crosses": {
      // A repeating vector tile keeps the symbol's diameter independent of its spacing.
      const radius = style.thickness * 50;
      const arm = radius / 3;
      const crossRadius = radius * (style.crossLength ?? 1);
      let symbol = style.pattern === "crosses"
        ? `<rect x="${50 - crossRadius}" y="${50 - arm}" width="${crossRadius * 2}" height="${arm * 2}"/><rect x="${50 - arm}" y="${50 - crossRadius}" width="${arm * 2}" height="${crossRadius * 2}"/>`
        : `<path d="M50 ${50 - radius} L${50 + radius} 50 L50 ${50 + radius} L${50 - radius} 50Z"/>`;
      if (style.pattern === "crosses") {
        const rotated = `<g transform="rotate(${style.crossRotation ?? 0} 50 50)">${symbol}</g>`;
        // Match the shader's neighbourhood, including diagonal and long rotated arms.
        symbol = Array.from({ length: 5 }, (_, x) => Array.from({ length: 5 }, (_, y) =>
          `<g transform="translate(${(x - 2) * 100} ${(y - 2) * 100})">${rotated}</g>`).join(""),
        ).join("");
      }
      const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${escapeAttribute(gap)}"/><g fill="${escapeAttribute(ink)}">${symbol}</g></svg>`;
      declarations.push(
        `--ddbi-background: url("data:image/svg+xml,${encodeURIComponent(tile)}")`,
        `--ddbi-background-size: ${period}px ${period}px`,
      );
      break;
    }
    case "checkerboard":
      declarations.push(
        `--ddbi-background: conic-gradient(from 90deg, ${ink} 25%, ${gap} 0 50%, ${ink} 0 75%, ${gap} 0)`,
        `--ddbi-background-size: ${period * 2}px ${period * 2}px`,
      );
      break;
    case "edge":
      declarations.push(`--ddbi-background: ${rgba(color, 0.15)}`);
      break;
    default:
      declarations.push(`--ddbi-background: ${stripes(across, gap)}`);
  }
  return declarations.join("; ");
}
