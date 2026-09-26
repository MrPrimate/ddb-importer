import DDBRegionDisplayConfig from "../../apps/DDBRegionDisplayConfig";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";
import { REGION_DISPLAY_FALLBACK_COLOR } from "../../config/regionDisplayProfiles";
import { displayFlag } from "./regionDisplay";
import { paintSheetImagePreviews } from "./regionDisplayImagePreview";
import { buildDisplaySummaryRow } from "./regionDisplaySummary";

/**
 * A compact "DDB Importer Region Display" box in the Region config's appearance tab: a swatch, a
 * one-line summary of the region's profile and overrides, and a button that opens
 * `DDBRegionDisplayConfig`. The box carries no form inputs, so the sheet's own submission
 * never touches the flag; the editor writes the document and the sheet re-renders the summary.
 */

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
  fieldset.append(row);
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
