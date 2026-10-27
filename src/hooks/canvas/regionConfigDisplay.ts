import DDBRegionDisplayConfig from "../../apps/DDBRegionDisplayConfig";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";
import {
  REGION_DISPLAY_FALLBACK_COLOR,
  REGION_DISPLAY_OUTLINE_FLAG_PATH,
  REGION_DISPLAY_OUTLINES,
} from "../../config/regionDisplayProfiles";
import { displayFlag } from "./regionDisplay";
import { regionOutlineFlag, worldOutlineChoice } from "./regionDisplayOutline";
import { paintSheetImagePreviews } from "./regionDisplayImagePreview";
import { buildDisplaySummaryRow } from "./regionDisplaySummary";

/**
 * A compact "DDB Importer Region Display" box in the Region config's appearance tab: a swatch, a
 * one-line summary of the region's profile and overrides, and a button that opens
 * `DDBRegionDisplayConfig`. The display choice has no form input, so the sheet's own submission
 * never touches that flag; the editor writes the document and the sheet re-renders the summary.
 * The outline choice is an ordinary named select, saved by the sheet like core's own fields.
 */

/**
 * The per-region outline select: follow the world setting (empty value), or pick grid squares
 * or the true shape. An empty value is stored as is and reads as "follow the setting".
 */
export function buildOutlineControl(doc: RegionDocument.Implementation, editable = true): HTMLElement {
  const group = document.createElement("div");
  group.classList.add("form-group", "ddbi-display-region-outline");
  const label = document.createElement("label");
  label.textContent = RegionDisplayProfiles.localize("outline.label");
  const fields = document.createElement("div");
  fields.classList.add("form-fields");
  const select = document.createElement("select");
  select.name = REGION_DISPLAY_OUTLINE_FLAG_PATH;
  select.disabled = !editable;
  select.id = `${doc.uuid ?? doc.id}-ddbi-display-outline`.replace(/\./g, "-");
  label.htmlFor = select.id;
  const current = regionOutlineFlag(doc) ?? "";
  const worldChoice = RegionDisplayProfiles.localize(`outline.${worldOutlineChoice()}`);
  const options: [string, string][] = [
    ["", RegionDisplayProfiles.format("outline.default", { setting: worldChoice })],
    ...REGION_DISPLAY_OUTLINES.map((value): [string, string] => [
      value,
      RegionDisplayProfiles.localize(`outline.${value}`),
    ]),
  ];
  for (const [value, text] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    option.selected = value === current;
    select.append(option);
  }
  fields.append(select);
  const hint = document.createElement("p");
  hint.classList.add("hint");
  hint.textContent = RegionDisplayProfiles.localize("outline.hint");
  group.append(label, fields, hint);
  return group;
}

/**
 * The box for a region: swatch (when styled), summary text and, when the user may change
 * the region, the configure button.
 */
export function buildDisplaySummary(doc: RegionDocument.Implementation, editable = true): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.classList.add("ddbi-display-region-fieldset");
  const legend = document.createElement("legend");
  legend.textContent = RegionDisplayProfiles.localize("Label");
  fieldset.append(legend);

  const row = buildDisplaySummaryRow({
    flag: displayFlag(doc),
    color: String(doc.color ?? REGION_DISPLAY_FALLBACK_COLOR),
    buttonClass: "ddbi-display-region-configure-region",
    editable,
  });
  row.querySelector("button")?.addEventListener("click", (event) => {
    event.preventDefault();
    DDBRegionDisplayConfig.open(doc);
  });
  fieldset.append(row, buildOutlineControl(doc, editable));
  return fieldset;
}

interface IRegionConfigLike {
  document?: RegionDocument.Implementation;
  /** The sheet's own verdict: an owner, outside a locked compendium. */
  isEditable?: boolean;
}

/** Insert the box after the highlight mode control, once per render. */
export function onRenderRegionConfig(app: IRegionConfigLike, element: HTMLElement): void {
  const doc = app.document;
  if (!doc || !(element instanceof HTMLElement)) return;
  if (element.querySelector(".ddbi-display-region-fieldset")) return;
  const anchor = element.querySelector<HTMLElement>(`[name="highlightMode"]`)?.closest<HTMLElement>(".form-group");
  if (!anchor) return;
  const editable = app.isEditable ?? doc.isOwner;
  anchor.insertAdjacentElement("afterend", buildDisplaySummary(doc, editable));
  paintSheetImagePreviews(app, element);
}

export function registerRegionConfigDisplay(): void {
  Hooks.on<"renderRegionConfig">("renderRegionConfig", (app: unknown, element: unknown) => {
    onRenderRegionConfig(app as IRegionConfigLike, element as HTMLElement);
  });
}
