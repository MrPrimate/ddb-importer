import DDBRegionHighlightConfig, { describeHighlightFlag } from "../../apps/DDBRegionHighlightConfig";
import RegionHighlightProfiles from "../../lib/RegionHighlightProfiles";
import { previewCss } from "./regionHighlightPreview";
import { highlightFlag } from "./regionHighlight";

/**
 * A compact "DDB Importer Region Texture" box in the Region config's appearance tab: a swatch, a
 * one-line summary of the region's profile and overrides, and a button that opens
 * `DDBRegionHighlightConfig`. The box carries no form inputs, so the sheet's own submission
 * never touches the flag; the editor writes the document and the sheet re-renders the summary.
 */

/** The box for a region: swatch (when styled), summary text and the configure button. */
export function buildHighlightSummary(doc: RegionDocument.Implementation): HTMLElement {
  const flag = highlightFlag(doc);
  const fieldset = document.createElement("fieldset");
  fieldset.classList.add("ddbi-highlight-fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "DDB Importer Region Texture";
  fieldset.append(legend);

  const row = document.createElement("div");
  row.classList.add("ddbi-highlight-summary");

  const style = RegionHighlightProfiles.resolve(flag);
  if (style) {
    const swatch = document.createElement("span");
    swatch.classList.add("ddbi-highlight-swatch");
    const fill = document.createElement("span");
    fill.classList.add("ddbi-highlight-fill");
    swatch.append(fill);
    swatch.setAttribute("style", previewCss(style, String(doc.color ?? "#ff6400"), 24));
    row.append(swatch);
  }

  const text = document.createElement("span");
  text.classList.add("ddbi-highlight-summary-text");
  text.textContent = describeHighlightFlag(flag);
  row.append(text);

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("ddbi-highlight-configure");
  button.innerHTML = `<i class="fa-solid fa-sliders" inert></i> Configure`;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    DDBRegionHighlightConfig.open(doc);
  });
  row.append(button);

  fieldset.append(row);
  return fieldset;
}

/** Insert the box after the highlight mode control, once per render. */
export function onRenderRegionConfig(
  app: { document?: RegionDocument.Implementation },
  element: HTMLElement,
): void {
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
