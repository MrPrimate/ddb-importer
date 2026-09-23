/**
 * A CSS approximation of a highlight style, for swatches in the profile editor and the
 * Region config. The canvas shader is the truth; this only has to read the same way.
 */

/** `#rrggbb` / `#rgb` to `rgba()`; other colour strings pass through untouched. */
export function rgba(color: string, alpha: number): string {
  const hex = color.trim().replace(/^#/, "");
  const short = (/^[0-9a-f]{3}$/i).test(hex);
  if (!short && !(/^[0-9a-f]{6}$/i).test(hex)) return color;
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
  IRegionHighlightProfile,
  "pattern" | "opacity" | "gapOpacity" | "borderOpacity" | "spacing" | "thickness" | "edgeWidth" | "color"
> &
  Partial<Pick<IRegionHighlightStyle, "dashed" | "dashLength" | "angle" | "border" | "borderWidth">>;

/**
 * Inline CSS declarations for a swatch. `regionColor` stands in for the region's own colour
 * when the style has none; `grid` is the swatch's pixel size of one grid square.
 *
 * The inner fill element composites the gap and ink before applying fill opacity. Its
 * pseudo-elements mask dashed ink. The outer element paints the independently opaque border.
 */
export function previewCss(style: TPreviewStyle, regionColor: string, grid = 50): string {
  const color = style.color || regionColor;
  const ink = rgba(color, 1);
  const gap = rgba(color, style.gapOpacity);
  const period = Math.max(1, style.spacing * grid);
  const thickness = Math.max(0.5, style.thickness * period);
  const declarations: string[] = [`--ddbi-fill-opacity: ${style.opacity}`];
  // a CSS gradient angle points across its stripes and 0deg points up, while the shader's
  // angle is the across-stripe direction with 0 pointing right, so the gradient is angle + 90
  const across = (style.angle ?? 45) + 90;
  const along = style.angle ?? 45;
  const stripes = (angle: number, rest: string) =>
    `repeating-linear-gradient(${angle}deg, ${ink} 0 ${thickness}px, ${rest} ${thickness}px ${period}px)`;
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
      `repeating-linear-gradient(${angle}deg, black 0 ${dash}px, transparent ${dash}px ${dash * 2}px)`;
    declarations.push(
      `--ddbi-background: ${gap}`,
      `--ddbi-ink: ${stripes(across, "transparent")}`,
      `--ddbi-mask: ${dashes(along)}`,
    );
    if (style.pattern === "crosshatch")
      declarations.push(`--ddbi-ink2: ${stripes(across + 90, "transparent")}`, `--ddbi-mask2: ${dashes(along + 90)}`);
    return declarations.join("; ");
  }
  switch (style.pattern) {
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
    case "diamonds": {
      // A repeating vector tile keeps the symbol's diameter independent of its spacing.
      const radius = style.thickness * 50;
      const escape = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
      const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${escape(gap)}"/><path d="M50 ${50 - radius} L${50 + radius} 50 L50 ${50 + radius} L${50 - radius} 50Z" fill="${escape(ink)}"/></svg>`;
      declarations.push(
        `--ddbi-background: url("data:image/svg+xml,${encodeURIComponent(tile)}")`,
        `--ddbi-background-size: ${period}px ${period}px`,
      );
      break;
    }
    case "edge":
      declarations.push(`--ddbi-background: ${rgba(color, 0.15)}`);
      break;
    default:
      declarations.push(`--ddbi-background: ${stripes(across, gap)}`);
  }
  return declarations.join("; ");
}
