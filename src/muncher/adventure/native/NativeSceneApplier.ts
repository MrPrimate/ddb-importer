import { logger, DDBSources } from "../../../lib/_module";
import SceneSnipProcessor from "../../../lib/SceneSnipProcessor";
import DDBMapMetaData from "../DDBMapMetaData";
import { buildJournalPageLookup, resolveNote, resolveSceneNotes } from "./NativeSceneNoteResolver";

type PreservedSnips = ReturnType<typeof SceneSnipProcessor.getSnips>;
// BuiltScene, JournalPageLookup + ItemNotify are declared globally in ./types.d.ts.

/**
 * Post-create world-side scene enrichment.
 *
 * For each scene created in this world this run, we synthesise a stub IDDBMap
 * (the shape DDBMapMetaData.enrich expects) and let the existing meta-data
 * apply path do its full job: cleansing, walls/lights/drawings placement, note
 * expansion via Iconizer, token import via AdventureMunchHelpers +
 * importFromCompendium. Reusing this path inherits years of edge-case
 * handling (V14 migrations, doorSound defaults, perfect-vision flag normalisation).
 *
 * After enrich, scene notes initially point at the meta-data placeholder
 * journal (the standard meta-data behaviour). We re-point them at our native
 * journal pages via NoteDocument.update so double-clicking a pin opens the
 * imported book journal page.
 *
 * Compendium-only path skips this entirely - scenes import bare (background +
 * dimensions + folder). Walls/lights/notes/tokens require a world Scene
 * document to apply, and tokens require world actors.
 */

function basename(path: string): string {
  if (!path) return "";
  const ix = path.lastIndexOf("/");
  return ix >= 0 ? path.slice(ix + 1) : path;
}

function stripSuffix(displayName: string): string {
  return displayName.replace(/\s*\((Player|Unlabeled|Ungridded|Map) Version\)\s*$/i, "").trim();
}

/**
 * Build a synthetic IDDBMap stub for `DDBMapMetaData.enrich`. The proxy match
 * code reads `bookCode` from `imageKey` (`official/maps/<book>/<file>`), plus
 * the explicit `name` + (filename via imageKey). We populate all three so the
 * match endpoint has the best chance of resolving the scene-info file.
 */
function mapStubForScene(scene: BuiltScene, bookCode: string, sourceId: number | null): any {
  return {
    id: scene.doc._id,
    imageKey: `official/maps/${bookCode}/${basename(scene.detection.imagePath)}`,
    name: stripSuffix(scene.detection.name),
    sourceId,
    // parentId (+ filename) is the cross-muncher-stable join the proxy keys on;
    // contentChunkId/ddbId are secondary disambiguators sent for completeness.
    parentId: scene.doc.flags?.ddb?.parentId ?? null,
    contentChunkId: scene.doc.flags?.ddb?.contentChunkId ?? null,
    ddbId: scene.doc.flags?.ddb?.ddbId ?? null,
    // Restrict the proxy match to the matching partition: missing scenes use a
    // player image whose filename collides with the non-missing entry sharing it.
    missing: scene.detection.source === "missing",
    officialData: { sourceId, filename: basename(scene.detection.imagePath) },
    flags: {},
  };
}

export async function repointNotesOnLiveScene(sceneDoc: Scene, lookup: JournalPageLookup): Promise<number> {
  const notes = sceneDoc?.notes?.contents ?? [];
  if (notes.length === 0) return 0;
  // Make a transient "scenes" array with the live notes embedded for the resolver.
  // We can't pass live NoteDocuments to resolveSceneNotes (it mutates plain
  // objects); instead, we manually look up each note's slug and call
  // NoteDocument.update.
  let repointed = 0;
  let anchored = 0;
  for (const note of notes) {
    const ref = resolveNote(note.flags, lookup, note.text);
    if (!ref) continue;
    try {
      const update: any = { entryId: ref.entryId, pageId: ref.pageId };
      // Stamp the resolved anchor so the activateNote -> anchorInjection hook
      // scrolls to the heading (it reads flags.ddb.slugLink).
      if (ref.anchor && note.flags?.ddb?.slugLink !== ref.anchor) {
        update.flags = { ddb: { slugLink: ref.anchor } };
      }
      await note.update(update);
      repointed += 1;
      if (ref.anchor) anchored += 1;
    } catch (error) {
      logger.warn(`NativeSceneApplier: failed to re-point note "${note.text ?? ""}" (${(error as Error).message})`);
    }
  }
  logger.debug(`NativeSceneApplier: scene "${sceneDoc.name}" re-pointed ${repointed}/${notes.length} notes (${anchored} with heading anchors)`);
  return repointed;
}

// Generate the Foundry sidebar thumbnail per scene. `scene.createThumbnail()`
// renders the level background to a small image and (in V14) writes it to the
// configured thumbnail location; we stamp the returned path onto scene.thumb.
// Same pattern as AdventureMunch._revisitScene + DDBEncounter post-create.
async function generateThumbnail(liveScene: Scene): Promise<void> {
  if (liveScene.thumb) return;
  try {
    const thumbData = await liveScene.createThumbnail();
    if (thumbData?.thumb) await liveScene.update({ thumb: thumbData.thumb });
  } catch (error) {
    logger.warn(`NativeSceneApplier: thumbnail generation failed for "${liveScene.name}" (${(error as Error).message ?? error})`);
  }
}

// Restore the edge-sampled background color when the post-enrich scene color
// is the bland default (older meta-data scene_info JSONs ship
// `backgroundColor: "#999999"` which overwrites our sympathetic edge sample
// in buildSceneUpdate). Idempotent: no-op when scene already has a non-default
// color or when no edge color was stashed.
async function restoreEdgeBackgroundColor(liveScene: Scene): Promise<boolean> {
  const edge = liveScene.flags?.ddbimporter?.edgeBackgroundColor;
  if (!edge || typeof edge !== "string") return false;

  // Foundry V14 stores color as a Color object (or HSV-like); coerce to a
  // hex string before comparing. Scene#backgroundColor is V14-deprecated;
  // only inspect/write levels[0].background.color.
  const DEFAULTS = new Set(["", "#999999", "#000000"]);
  const isDefault = (raw: any): boolean => {
    if (raw == null) return true;
    const s = typeof raw === "string" ? raw : (typeof raw.toString === "function" ? String(raw) : "");
    return DEFAULTS.has(s.toLowerCase());
  };

  const firstLevel = liveScene.levels?.contents?.[0] ?? liveScene.levels?.[0];
  if (!firstLevel?._id) return false;
  const levelColor = firstLevel?.background?.color;
  if (!isDefault(levelColor)) return false;

  try {
    await liveScene.update({
      levels: [{ _id: firstLevel._id, background: { color: edge } }],
    });
    return true;
  } catch (error) {
    logger.warn(`NativeSceneApplier: restore edge color failed for "${liveScene.name}" (${(error as Error).message ?? error})`);
    return false;
  }
}

// Hide every token on the scene. Mirrors AdventureMunch._getTokens line 654
// (`updateData.hidden = true`) - imported NPC tokens stay hidden until the GM
// reveals them. Idempotent: skips tokens already hidden.
async function hideAllTokens(liveScene: Scene): Promise<number> {
  const tokens = liveScene.tokens?.contents ?? [];
  const updates = tokens
    .filter((t: TokenDocument.Implementation) => !t.hidden)
    .map((t: TokenDocument.Implementation) => ({ _id: t.id, hidden: true }));
  if (updates.length === 0) return 0;
  try {
    await liveScene.updateEmbeddedDocuments("Token", updates);
    return updates.length;
  } catch (error) {
    logger.warn(`NativeSceneApplier: hide-tokens failed for "${liveScene.name}" (${(error as Error).message ?? error})`);
    return 0;
  }
}

/**
 * Capture snip configs from any scene about to be overwritten. MUST run before
 * the scene documents are created/updated, while the live scenes still hold
 * their original `snipsnipsnip` flags. Returns a map keyed by scene _id of the
 * non-empty snip configs to reapply post-enrich.
 *
 * Mirrors AdventureMunch._importRenderedSceneFile (getSnips before overwrite),
 * adapted for the Native update-in-place flow (no full-scene delete).
 */
export function captureExistingSnips(scenes: BuiltScene[]): Map<string, PreservedSnips> {
  const preserved = new Map<string, PreservedSnips>();
  for (const scene of scenes) {
    const liveScene = game.scenes?.get(scene.doc._id);
    if (!liveScene) continue;
    const snips = SceneSnipProcessor.getSnips(liveScene as Scene);
    if (snips.length) preserved.set(scene.doc._id, snips);
  }
  return preserved;
}

// Clean up then recreate snips on a re-imported scene. Unlike the legacy muncher
// (which deletes the whole scene), Native updates in place, so the old snip Tiles
// survive the update and must be deleted explicitly before reapply to avoid
// duplicates. SceneSnipProcessor.reapplySnips re-extracts each snip from the new
// background and rewrites the `snipsnipsnip.snips` flag with fresh tile ids.
async function reapplyScenesSnips(liveScene: Scene, snips: PreservedSnips): Promise<boolean> {
  try {
    const tiles = liveScene.tiles?.contents ?? [];
    const staleIds = tiles
      .filter((t: TileDocument.Implementation) => !!t.flags?.snipsnipsnip)
      .map((t: TileDocument.Implementation) => t.id)
      .filter(Boolean) as string[];
    if (staleIds.length) await liveScene.deleteEmbeddedDocuments("Tile", staleIds);
    await SceneSnipProcessor.reapplySnips(liveScene, snips);
    return true;
  } catch (error) {
    logger.warn(`NativeSceneApplier: reapply snips failed for "${liveScene.name}" (${(error as Error).message ?? error})`);
    return false;
  }
}

/**
 * Per-scene enrich + note re-point + thumbnail. World-only.
 *
 * Grid normalisation now happens upstream in `DDBMapMetaData.buildSceneUpdate`
 * (merge with sane defaults + resolution scaling); no post-enrich grid pass
 * needed here.
 *
 * @param scenes the BuiltScene[] returned by buildScenes
 * @param journals the journal docs created this run (used for slug→pageId lookup)
 * @param bookCode the active book
 * @param options.applyTokens when false, tokens are skipped (compendium-only path)
 */
export async function applyScenes(
  scenes: BuiltScene[],
  journals: any[],
  bookCode: string,
  options: {
    applyTokens: boolean;
    notify?: ItemNotify;
    monsterSwap?: Map<number, { id2024: number; name2024: string }>;
    preservedSnips?: Map<string, PreservedSnips>;
  } = { applyTokens: true },
): Promise<void> {
  if (scenes.length === 0) return;
  const source = (CONFIG.DDB?.sources ?? []).find((s: IDDBConfigSource) => s.name?.toLowerCase?.() === bookCode.toLowerCase());
  const sourceId: number | null = source ? Number(source.id) : null;
  // Adventure-named Actor folder for monsters imported via meta-data tokens.
  // Mirrors ThirdPartyMunch._getAdjustedScenes (single-level path by book name).
  const bookName = DDBSources.getBookName(bookCode) || bookCode;
  const actorFolderPath = [bookName];

  const lookup = buildJournalPageLookup(journals);

  let enriched = 0;
  let repointed = 0;
  let thumbed = 0;
  let hidden = 0;
  let restored = 0;
  let snipped = 0;
  for (let sceneNum = 0; sceneNum < scenes.length; sceneNum++) {
    const scene = scenes[sceneNum];
    options.notify?.(sceneNum + 1, scenes.length, `Applying scene: ${scene.doc.name}`);
    const liveScene = game.scenes?.get(scene.doc._id) as Scene | undefined;
    if (!liveScene) {
      logger.debug(`NativeSceneApplier: scene ${scene.doc._id} ("${scene.doc.name}") not in world; skipping enrich`);
      continue;
    }
    const mapStub = mapStubForScene(scene, bookCode, sourceId);
    try {
      const results = await DDBMapMetaData.enrich(liveScene as any, mapStub, {
        applyTokens: options.applyTokens,
        noAutoImport: false,
        actorFolderPath,
        monsterSwap: options.monsterSwap,
      });
      if (results.length) {
        enriched += 1;
        repointed += await repointNotesOnLiveScene(liveScene, lookup);
      }
    } catch (error) {
      logger.warn(`NativeSceneApplier: enrich failed for "${scene.doc.name}" (${(error as Error).message ?? error})`);
    }
    if (options.applyTokens) hidden += await hideAllTokens(liveScene);
    if (await restoreEdgeBackgroundColor(liveScene)) restored += 1;
    const hadThumb = !!liveScene.thumb;
    await generateThumbnail(liveScene);
    if (!hadThumb && liveScene.thumb) thumbed += 1;

    // Reapply preserved scene snips on overwrite: clean up stale snip tiles, then
    // re-extract from the new background. Only fires for scenes that already
    // existed (captureExistingSnips only maps live scenes).
    const snips = options.preservedSnips?.get(scene.doc._id);
    if (snips?.length) {
      logger.info(`NativeSceneApplier: reapplying ${snips.length} snip(s) for scene "${scene.doc.name}"`);
      if (await reapplyScenesSnips(liveScene, snips)) snipped += 1;
    }
  }

  // Resolver run for any scene that had no meta match (its notes are empty,
  // but if a future build path adds bare notes from the row we still want
  // them re-pointed). No-op when scene.notes is empty.
  resolveSceneNotes(scenes.map((s) => s.doc), lookup);

  logger.info(`NativeSceneApplier: enriched ${enriched}/${scenes.length} scenes (${repointed} note pins re-pointed, ${hidden} tokens hidden, ${restored} bg colors restored, ${thumbed} thumbnails generated, ${snipped} scenes had snips reapplied)`);
}
