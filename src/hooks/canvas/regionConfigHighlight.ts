import DDBRegionHighlightConfig from "../../apps/DDBRegionHighlightConfig";
import { highlightFlag } from "./regionHighlight";
import { buildHighlightSummaryRow, REGION_HIGHLIGHT_FALLBACK_COLOR } from "./regionHighlightSummary";

/**
 * A compact "DDB Importer Region Texture" box in the Region config's appearance tab: a swatch, a
 * one-line summary of the region's profile and overrides, and a button that opens
 * `DDBRegionHighlightConfig`. The box carries no form inputs, so the sheet's own submission
 * never touches the flag; the editor writes the document and the sheet re-renders the summary.
 */

/** The box for a region: swatch (when styled), summary text and the configure button. */
export function buildHighlightSummary(doc: RegionDocument.Implementation): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.classList.add("ddbi-highlight-fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "DDB Importer Region Texture";
  fieldset.append(legend);

  const row = buildHighlightSummaryRow({
    flag: highlightFlag(doc),
    color: String(doc.color ?? REGION_HIGHLIGHT_FALLBACK_COLOR),
    buttonClass: "ddbi-highlight-region-configure",
  });
  row.querySelector("button")?.addEventListener("click", (event) => {
    event.preventDefault();
    DDBRegionHighlightConfig.open(doc);
  });
  fieldset.append(row);
  return fieldset;
}

/** Insert the box after the highlight mode control, once per render. */
export function onRenderRegionConfig(app: { document?: RegionDocument.Implementation }, element: HTMLElement): void {
  const doc = app.document;
  if (!doc || !(element instanceof HTMLElement)) return;
  if (element.querySelector(".ddbi-highlight-fieldset")) return;
  const anchor = element.querySelector<HTMLElement>(`[name="highlightMode"]`)?.closest<HTMLElement>(".form-group");
  if (!anchor) return;
  anchor.insertAdjacentElement("afterend", buildHighlightSummary(doc));
}

export function registerRegionConfigHighlight(): void {
  Hooks.on<"renderRegionConfig">("renderRegionConfig", (app: unknown, element: unknown) => {
    onRenderRegionConfig(app as { document?: RegionDocument.Implementation }, element as HTMLElement);
  });
}
