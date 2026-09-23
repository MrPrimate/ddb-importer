import {
  REGION_HIGHLIGHT_LIMITS,
  REGION_HIGHLIGHT_PATTERN_LABELS,
  REGION_HIGHLIGHT_PATTERNS,
} from "../../config/regionHighlightProfiles";
import RegionHighlightProfiles from "../../lib/RegionHighlightProfiles";
import { createProfilePicker } from "./regionHighlightPicker";
import { previewCss } from "./regionHighlightPreview";
import { highlightFlag } from "./regionHighlight";

/**
 * A "DDB Importer Highlight" fieldset in the Region config's appearance tab, so any region,
 * hand-drawn ones and Aura Effects auras included, can take a profile and overrides. The
 * inputs are named after the flag path and the sheet's own form submission stores them.
 */

const FLAG_PATH = "flags.ddbimporter.highlight";
const NUMERIC_FIELDS: { key: keyof typeof REGION_HIGHLIGHT_LIMITS; label: string }[] = [
  { key: "opacity", label: "Opacity" },
  { key: "spacing", label: "Spacing (grid squares)" },
  { key: "thickness", label: "Thickness (0-1)" },
  { key: "edgeWidth", label: "Edge Width (grid squares)" },
  { key: "dashLength", label: "Dash Length (grid squares)" },
  { key: "angle", label: "Line Angle (degrees)" },
  { key: "borderWidth", label: "Border Width (grid squares)" },
];

function choiceSelect(name: string, current: string, options: { value: string; label: string }[]): HTMLSelectElement {
  const select = document.createElement("select");
  select.name = name;
  for (const option of options) {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    if (current === option.value) element.selected = true;
    select.append(element);
  }
  return select;
}

function formGroup(label: string, field: HTMLElement, hint?: string): HTMLElement {
  const group = document.createElement("div");
  group.classList.add("form-group");
  const labelElement = document.createElement("label");
  labelElement.textContent = label;
  const fields = document.createElement("div");
  fields.classList.add("form-fields");
  fields.append(field);
  group.append(labelElement, fields);
  if (hint) {
    const hintElement = document.createElement("p");
    hintElement.classList.add("hint");
    hintElement.textContent = hint;
    group.append(hintElement);
  }
  return group;
}

export function buildHighlightFieldset(doc: RegionDocument.Implementation): HTMLElement {
  const flag = highlightFlag(doc) ?? {};
  const fieldset = document.createElement("fieldset");
  fieldset.classList.add("ddbi-highlight-fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "DDB Importer Highlight";
  fieldset.append(legend);

  fieldset.append(
    formGroup(
      "Profile",
      createProfilePicker({ name: `${FLAG_PATH}.profile`, value: flag.profile ?? "", blank: "None (Foundry default)" }),
      "How this region's highlight is drawn. Leave the overrides blank to take the profile's values.",
    ),
  );

  fieldset.append(
    formGroup(
      "Pattern",
      choiceSelect(`${FLAG_PATH}.pattern`, flag.pattern ?? "", [
        { value: "", label: "Profile default" },
        ...REGION_HIGHLIGHT_PATTERNS.map((value) => ({ value, label: REGION_HIGHLIGHT_PATTERN_LABELS[value] })),
      ]),
    ),
  );
  const dashed = RegionHighlightProfiles.dashedValue(flag.dashed);
  fieldset.append(
    formGroup(
      "Lines",
      choiceSelect(`${FLAG_PATH}.dashed`, dashed === null ? "" : dashed ? "dashed" : "continuous", [
        { value: "", label: "Profile default" },
        { value: "dashed", label: "Dashed" },
        { value: "continuous", label: "Continuous" },
      ]),
      "Dashes apply to the line patterns; the edge band is always continuous.",
    ),
  );
  const border = RegionHighlightProfiles.borderValue(flag.border);
  fieldset.append(
    formGroup(
      "Border",
      choiceSelect(`${FLAG_PATH}.border`, border === null ? "" : border ? "border" : "none", [
        { value: "", label: "Profile default" },
        { value: "border", label: "Border" },
        { value: "none", label: "No border" },
      ]),
      "A band inside the edge on top of the fill; the Edge Band pattern always has one.",
    ),
  );

  for (const { key, label } of NUMERIC_FIELDS) {
    const input = document.createElement("input");
    input.type = "number";
    input.name = `${FLAG_PATH}.${key}`;
    input.min = String(REGION_HIGHLIGHT_LIMITS[key].min);
    input.max = String(REGION_HIGHLIGHT_LIMITS[key].max);
    input.step = String(REGION_HIGHLIGHT_LIMITS[key].step);
    input.placeholder = "profile";
    const value = flag[key];
    if (value !== null && value !== undefined && value !== "") input.value = String(value);
    fieldset.append(formGroup(label, input));
  }

  const color = document.createElement("color-picker");
  color.setAttribute("name", `${FLAG_PATH}.color`);
  if (flag.color) color.setAttribute("value", flag.color);
  fieldset.append(formGroup("Colour", color, "Blank uses the profile's colour, or the region's own."));

  const style = RegionHighlightProfiles.resolve(flag);
  if (style) {
    const swatch = document.createElement("div");
    swatch.classList.add("ddbi-highlight-swatch");
    swatch.setAttribute("style", previewCss(style, String(doc.color ?? "#ff6400")));
    fieldset.append(formGroup("Preview", swatch));
  }
  return fieldset;
}

/** Insert the fieldset after the highlight mode control, once per render. */
export function onRenderRegionConfig(
  app: { document?: RegionDocument.Implementation; setPosition?: (position: Record<string, unknown>) => unknown },
  element: HTMLElement,
): void {
  const doc = app.document;
  if (!doc || !(element instanceof HTMLElement)) return;
  if (element.querySelector(".ddbi-highlight-fieldset")) return;
  const anchor = element.querySelector<HTMLElement>(`[name="highlightMode"]`)?.closest<HTMLElement>(".form-group");
  if (!anchor) return;
  anchor.insertAdjacentElement("afterend", buildHighlightFieldset(doc));
  app.setPosition?.({ height: "auto" });
}

export function registerRegionConfigHighlight(): void {
  Hooks.on<"renderRegionConfig">("renderRegionConfig", (app: unknown, element: unknown) => {
    onRenderRegionConfig(app as { document?: RegionDocument.Implementation }, element as HTMLElement);
  });
}
