import { utils } from "../../lib/_module";

// Debug-only badge on Scenes sidebar entries showing whether ddb-meta-data
// enrichment was stamped on the scene (flags.ddbimporter.metaDataApplied).
// Re-injected on every renderSceneDirectory because ApplicationV2 replaces
// the directory DOM wholesale on each render.
export default function addMetaDataIndicators(_app: unknown, html: HTMLElement): void {
  if (!utils.getSetting<boolean>("developer-mode")) return;

  for (const li of html.querySelectorAll<HTMLLIElement>("li.directory-item.scene[data-entry-id]")) {
    const scene = game.scenes?.get(li.dataset.entryId ?? "");
    const flags = (scene as any)?.flags?.ddbimporter as IDDBImporterSceneFlags | undefined;
    if (flags?.metaDataApplied === undefined) continue;
    if (li.querySelector(".ddbimporter-meta-badge")) continue;

    const badge = document.createElement("i");
    if (flags.metaDataApplied) {
      const match = flags.metaDataMatch;
      const matchText = match
        ? `${match.bookCode}/${match.filepath} (${match.matchedBy})`
        : "no match info";
      badge.className = "fa-solid fa-map-location-dot ddbimporter-meta-badge ddbimporter-meta-badge--ok";
      badge.dataset.tooltip = `DDB Meta: ${matchText}`;
    } else {
      badge.className = "fa-solid fa-triangle-exclamation ddbimporter-meta-badge ddbimporter-meta-badge--fail";
      badge.dataset.tooltip = `DDB Meta failed: ${flags.metaDataError ?? flags.metaDataReason ?? "unknown"}`;
    }
    badge.dataset.tooltipDirection = "UP";
    li.append(badge);
  }
}
