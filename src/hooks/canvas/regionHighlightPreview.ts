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
  IRegionHighlightStyle,
  "pattern" | "opacity" | "spacing" | "thickness" | "edgeWidth" | "color"
> &
  Partial<Pick<IRegionHighlightStyle, "dashed" | "dashLength" | "angle" | "border" | "borderWidth">>;

/**
 * Inline CSS declarations for a swatch. `regionColor` stands in for the region's own colour
 * when the style has none; `grid` is the swatch's pixel size of one grid square.
 *
 * Dashed line patterns paint the continuous gap fill on the element and the ink on its
 * `::after` / `::before` pseudo-elements (css/default.css reads the `--ddbi-ink*` and
 * `--ddbi-mask*` custom properties), so only the ink is cut into dashes, as on the canvas.
 */
export function previewCss(style: TPreviewStyle, regionColor: string, grid = 50): string {
  const color = style.color || regionColor;
  const ink = rgba(color, 1);
  // gaps keep a third of the alpha, as the shader does
  const gap = rgba(color, 0.3333);
  const period = Math.max(1, style.spacing * grid);
  const thickness = Math.max(0.5, style.thickness * period);
  const declarations: string[] = [`opacity: ${style.opacity}`];
  // a CSS gradient angle points across its stripes and 0deg points up, while the shader's
  // angle is the across-stripe direction with 0 pointing right, so the gradient is angle + 90
  const across = (style.angle ?? 45) + 90;
  const along = style.angle ?? 45;
  const stripes = (angle: number, rest: string) =>
    `repeating-linear-gradient(${angle}deg, ${ink} 0 ${thickness}px, ${rest} ${thickness}px ${period}px)`;
  if (style.border && style.pattern !== "edge") {
    // an outline paints above the pseudo-elements, so it reads over dashed ink too
    const width = Math.max(1, (style.borderWidth ?? 0.1) * grid);
    declarations.push(`outline: ${width}px solid ${ink}`, `outline-offset: -${width}px`);
  }
  const dashedLines = style.dashed === true && (style.pattern === "hatch" || style.pattern === "crosshatch");
  if (dashedLines) {
    const dash = Math.max(1, (style.dashLength ?? 0.25) * grid);
    const dashes = (angle: number) =>
      `repeating-linear-gradient(${angle}deg, black 0 ${dash}px, transparent ${dash}px ${dash * 2}px)`;
    declarations.push(
      `background: ${gap}`,
      `--ddbi-ink: ${stripes(across, "transparent")}`,
      `--ddbi-mask: ${dashes(along)}`,
    );
    if (style.pattern === "crosshatch")
      declarations.push(`--ddbi-ink2: ${stripes(across + 90, "transparent")}`, `--ddbi-mask2: ${dashes(along + 90)}`);
    return declarations.join("; ");
  }
  switch (style.pattern) {
    case "solid":
      declarations.push(`background: ${ink}`);
      break;
    case "crosshatch":
      declarations.push(`background: ${stripes(across, "transparent")}, ${stripes(across + 90, gap)}`);
      break;
    case "dots":
      declarations.push(
        `background: radial-gradient(circle, ${ink} ${thickness / 2}px, ${gap} ${thickness / 2 + 0.5}px)`,
        `background-size: ${period}px ${period}px`,
      );
      break;
    case "edge":
      declarations.push(
        `background: ${rgba(color, 0.15)}`,
        `box-shadow: inset 0 0 0 ${Math.max(1, style.edgeWidth * grid)}px ${ink}`,
      );
      break;
    default:
      declarations.push(`background: ${stripes(across, gap)}`);
  }
  return declarations.join("; ");
}
