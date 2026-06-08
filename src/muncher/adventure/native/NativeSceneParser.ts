import { logger, utils } from "../../../lib/_module";
import { ensureAssetsPrefix } from "./NativeShared";
// ProcessedRow + DetectedScene are declared globally in ./types.d.ts.

/**
 * DOMParser port of the Node muncher's SceneParser
 * (ddb-adventure-muncher/munch/adventure/Scenes/SceneParser.js).
 *
 * Scans a row's rendered HTML for map images and returns one DetectedScene per
 * unique scene. Four parallel selectors, in priority order:
 *
 *   1. `<figure>` (modern layouts) - figcaption text = title; `<a>` with
 *      `data-title` matching player/unlabeled/without/map (or whose text contains
 *      "player") points at the map image (`ddb://image/...`).
 *   2. `div.compendium-image-with-subtitle-{center,right,left}` (legacy) - only
 *      when no figures were found. Caption is the first `<h3|h4>`; we scan up
 *      to 15 forward siblings for an `<a.ddb-lightbox-outer>` whose text
 *      contains "player"/"unlabeled".
 *   3. `p.compendium-image-view-player` (whole-page player maps) - only when no
 *      figures were found.
 *   4. `a.ddb-lightbox-{inner,outer}` (fallback) - always runs; catches edge
 *      cases the structured selectors missed.
 *
 * Within a row, the same image path only becomes a scene once
 * ([SceneParser.js:62-66](ddb-adventure-muncher/munch/adventure/Scenes/SceneParser.js#L62)).
 * Cross-row dedup is the builder's job (Scene._id is deterministic on row + image).
 */

// muncher Helpers.titleString: trim + collapse internal whitespace; light case.
function titleString(s: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Convert a journal image href to the canonical assetMap key.
 *   "ddb://image/lmop/foo.jpg" + bookCode="lmop" → "assets/foo.jpg"
 *
 * The bookCode subfolder strip mirrors NativeLinkReplacer.replaceImageLinks
 * (and muncher's ImageJournal.replaceImgLinksForJournal); without it the
 * scene parser produces `assets/lmop/foo.jpg` which never matches the
 * flat-keyed assetMap and 404s on load.
 */
function imageHrefToAsset(href: string, bookCode: string): string {
  if (!href) return href;
  let stripped = href.replace(/^ddb:\/\/image\/?/, "").replace(/^\.?\//, "");
  const prefix = `${bookCode}/`;
  if (stripped.toLowerCase().startsWith(prefix.toLowerCase())) {
    stripped = stripped.slice(prefix.length);
  }
  return ensureAssetsPrefix(stripped);
}

function selectChildText(root: Element, selector: string, predicate: (el: Element) => boolean): Element | null {
  const matches = root.querySelectorAll(selector);
  for (const el of Array.from(matches)) {
    if (predicate(el)) return el;
  }
  return null;
}

/** Scan one row's sourceHtml for scenes. Returns [] when none. */
export function scanForScenes(row: ProcessedRow, bookCode: string): DetectedScene[] {
  if (!row.sourceHtml) return [];
  const doc = utils.htmlToDoc(row.sourceHtml);

  const seenImagePaths = new Set<string>();
  const scenes: DetectedScene[] = [];
  let tmpCount = 0;
  const documentName = row.title;

  const push = (entry: Omit<DetectedScene, "syntheticIdOffset"> & { idBase: number }) => {
    if (!entry.imagePath) return;
    if (seenImagePaths.has(entry.imagePath)) return;
    seenImagePaths.add(entry.imagePath);
    scenes.push({
      name: entry.name,
      imagePath: entry.imagePath,
      contentChunkId: entry.contentChunkId,
      isPlayer: entry.isPlayer,
      source: entry.source,
      syntheticIdOffset: entry.idBase + tmpCount,
    });
    tmpCount++;
  };

  // 1. figures
  const figureNodes = Array.from(doc.body.querySelectorAll("figure"));
  for (const node of figureNodes) {
    const caption = node.querySelector("figcaption");
    const img = node.querySelector("img") as HTMLImageElement | null;
    if (!caption) continue;
    tmpCount++;

    const title = titleString(caption.textContent ?? "").replace(/  +/g, " ");
    const anchors = Array.from(node.querySelectorAll("a"));
    const playerAll = anchors.find((el) => (el.textContent ?? "").toLowerCase().includes("player"));
    const playerRef = node.querySelector("a[data-title*='player' i]") as HTMLAnchorElement | null ?? playerAll as HTMLAnchorElement | null;
    const unlabeledRef = node.querySelector("a[data-title*='unlabeled' i]") as HTMLAnchorElement | null;
    const ungriddedRef = node.querySelector("a[data-title*='without' i]") as HTMLAnchorElement | null;
    const looksLikeMap = title.toLowerCase().startsWith("map") || (img?.getAttribute("src") ?? "").includes("/map-");
    const mapRef = looksLikeMap ? node.querySelector("a") as HTMLAnchorElement | null : null;

    const buildName = (titleType: string) => {
      const ref = playerRef ?? unlabeledRef ?? ungriddedRef ?? mapRef;
      const refText = ref?.textContent ?? "";
      const stripped = refText && title.includes(refText) ? titleString(title.replace(refText, "")) : title;
      return `${stripped} (${titleType} Version)`;
    };

    const chunkFromCaption = caption.getAttribute("data-content-chunk-id");
    const chunkFallback = `${(node as HTMLElement).id || "figure"}-${tmpCount}`;
    const contentChunkId = chunkFromCaption ?? chunkFallback;

    if (playerRef || unlabeledRef) {
      const ref = playerRef ?? unlabeledRef!;
      const href = ref.getAttribute("href") ?? "";
      if (href.endsWith(".pdf")) continue;
      push({
        name: buildName(playerRef ? "Player" : "Unlabeled"),
        imagePath: imageHrefToAsset(href, bookCode),
        contentChunkId,
        isPlayer: !!playerRef,
        source: "figure",
        idBase: 10000 + row.id,
      });
    } else if (img && (ungriddedRef || mapRef)) {
      const ref = ungriddedRef ?? mapRef!;
      const imgSrc = img.getAttribute("src") ?? "";
      push({
        name: buildName(ungriddedRef ? "Ungridded" : "Map"),
        imagePath: imageHrefToAsset(imgSrc, bookCode),
        contentChunkId,
        isPlayer: false,
        source: "figure",
        idBase: 10000 + row.id,
      });
      // record we also "used" the ref href so the ddb-lightbox fallback doesn't re-emit it
      const refHref = ref.getAttribute("href") ?? "";
      if (refHref) seenImagePaths.add(imageHrefToAsset(refHref, bookCode));
    }
  }

  // 2. div.compendium-image-with-subtitle-* (legacy; only when no figures present)
  if (figureNodes.length === 0) {
    const divNodes = Array.from(doc.body.querySelectorAll(
      "div.compendium-image-with-subtitle-center, div.compendium-image-with-subtitle-right, div.compendium-image-with-subtitle-left",
    ));
    for (const node of divNodes) {
      const caption = node.querySelector("h3, h4");
      const img = node.querySelector("img") as HTMLImageElement | null;
      if (!img || !img.getAttribute("src") || !caption) continue;
      tmpCount++;

      let title = caption.textContent ?? "";
      let lightBoxNode: HTMLAnchorElement | null = null;
      let nextNode: Element | null = node;

      // walk up to 15 forward siblings for an ddb-lightbox-outer anchor.
      // matches the muncher's defensive scan; falls back to nested <a> when
      // we run off the end of the tree.
      for (let i = 0; i < 15; i++) {
        if (!nextNode) {
          lightBoxNode = selectChildText(node, "a.ddb-lightbox-outer", (el) => {
            const t = (el.textContent ?? "").toLowerCase();
            return t.includes("player") || t.includes("unlabeled");
          }) as HTMLAnchorElement | null;
          break;
        }
        nextNode = nextNode.nextElementSibling;
        if (!nextNode) continue;
        if (nextNode.tagName !== "P") continue;
        lightBoxNode = nextNode.querySelector("a.ddb-lightbox-outer") as HTMLAnchorElement | null;
        if (lightBoxNode) break;
      }

      if (!lightBoxNode) continue;
      const linkText = (lightBoxNode.textContent ?? "").toLowerCase();
      const playerVersion = linkText.includes("player");
      const unlabeledVersion = linkText.includes("unlabeled");
      if (!playerVersion && !unlabeledVersion) continue;

      title = titleString(title.replace(lightBoxNode.textContent ?? "", ""));
      const titleType = playerVersion ? "Player" : "Unlabeled";
      const href = lightBoxNode.getAttribute("href") ?? "";
      const contentChunkId = (nextNode?.getAttribute("data-content-chunk-id"))
        ?? lightBoxNode.getAttribute("data-content-chunk-id")
        ?? `div-${tmpCount}`;

      push({
        name: `${title} (${titleType} Version)`,
        imagePath: imageHrefToAsset(href, bookCode),
        contentChunkId,
        isPlayer: playerVersion,
        source: "div",
        idBase: 11000 + row.id,
      });
    }
  }

  // 3. p.compendium-image-view-player (only when no figures)
  if (figureNodes.length === 0) {
    const viewPlayerNodes = Array.from(doc.body.querySelectorAll("p.compendium-image-view-player"));
    for (const node of viewPlayerNodes) {
      const aNode = node.querySelector("a.ddb-lightbox-outer") as HTMLAnchorElement | null;
      if (!aNode) continue;
      tmpCount++;
      const href = aNode.getAttribute("href") ?? "";
      const contentChunkId = node.getAttribute("data-content-chunk-id") ?? `viewplayer-${tmpCount}`;
      push({
        name: `${documentName} (Player Version)`,
        imagePath: imageHrefToAsset(href, bookCode),
        contentChunkId,
        isPlayer: true,
        source: "viewplayer",
        idBase: 13000 + row.id,
      });
    }
  }

  // 4. a.ddb-lightbox-{inner,outer} fallback - always runs
  const fallbackAnchors = Array.from(doc.body.querySelectorAll("a.ddb-lightbox-inner, a.ddb-lightbox-outer"));
  for (const node of fallbackAnchors as HTMLAnchorElement[]) {
    const href = node.getAttribute("href") ?? "";
    if (!href) continue;
    const text = (node.textContent ?? "").toLowerCase();
    const playerNode = text.includes("player");
    const unlabeledNode = text.includes("unlabeled");
    if (!playerNode && !unlabeledNode) continue;
    const assetPath = imageHrefToAsset(href, bookCode);
    if (seenImagePaths.has(assetPath)) continue;
    tmpCount++;

    const titleType = playerNode ? "Player" : "Unlabeled";
    const parent = node.parentElement;
    const contentChunkId = parent?.getAttribute("data-content-chunk-id")
      ?? node.getAttribute("data-content-chunk-id")
      ?? `${row.id}-${row.parentId ?? "x"}-${tmpCount}-${row.slug ?? "x"}`.replace("#", "-");

    push({
      name: `${documentName} (${titleType} Version)`,
      imagePath: assetPath,
      contentChunkId,
      isPlayer: playerNode,
      source: "linkfallback",
      idBase: 14000 + row.id,
    });
  }

  if (scenes.length > 0) {
    logger.debug(`NativeSceneParser: row "${documentName}" → ${scenes.length} scene(s)`);
  }
  return scenes;
}
