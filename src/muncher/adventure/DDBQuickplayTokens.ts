import { logger, CompendiumHelper, FolderHelper, FileHelper, utils } from "../../lib/_module";
import DDBMaps from "../DDBMaps";
import AdventureMunchHelpers from "./AdventureMunchHelpers";

// Same constant as DDBQuickplay - DDB stores positions in 100-px-per-unit
// regardless of the image's actual cellPx. See DDBQuickplay for derivation.
const POSITION_UNIT_PX = 100;
const DEFAULT_LEVEL_ID = "defaultLevel0000";


export default class DDBQuickplayTokens {

  static readonly POSITION_UNIT_PX = POSITION_UNIT_PX;

  // Translate DDB token grid-units to Foundry canvas pixels using the same
  // formula as stickers (image-centred origin, Y-flipped, snapped to grid).
  // Tokens have no `size` field of their own - their size comes from the
  // actor's prototype token, so we just compute the centre point and let
  // Foundry's getTokenDocument handle the rest.
  private static _centreCanvas(
    e: IDDBPreparedTokenEntity,
    state: IDDBPreparedState,
    sceneScale: number,
    sceneXPad: number,
    sceneYPad: number,
  ): { x: number; y: number } {
    const imageWidth = state.size?.width ?? 0;
    const imageHeight = state.size?.height ?? 0;
    const xImg = e.position[0] * POSITION_UNIT_PX + imageWidth / 2;
    const yImg = -e.position[1] * POSITION_UNIT_PX + imageHeight / 2;
    return {
      x: xImg * sceneScale + sceneXPad,
      y: yImg * sceneScale + sceneYPad,
    };
  }

  // Walk an outermost-to-innermost folder name chain, creating missing
  // entries via FolderHelper.getOrCreateFolder for type "Actor". Returns the
  // leaf folder id, or null when the path is empty/falsy.
  private static async _resolveActorFolderId(path: string[] | null): Promise<string | null> {
    if (!path?.length) return null;
    let parent: any = null;
    for (const rawName of path) {
      const name = (rawName ?? "").trim();
      if (!name) continue;
      try {
        parent = await FolderHelper.getOrCreateFolder(parent, "Actor", name);
      } catch (error) {
        logger.warn(`DDBQuickplayTokens: failed to ensure Actor folder "${name}": ${(error as Error).message}`);
        return parent?.id ?? null;
      }
    }
    return parent?.id ?? null;
  }

  // Resolve the directory under maps-upload-path used to store imported
  // Quickplay token images. Defaults to `<maps-upload-path>/quickplay-tokens`
  // and is created on demand.
  private static _tokenImageDirectory(): string {
    const base = utils.getSetting<string>("maps-upload-path") ?? "";
    const trimmed = base.replace(/\/+$/, "");
    return trimmed ? `${trimmed}/quickplay-tokens` : "quickplay-tokens";
  }

  // Build a stable, filesystem-safe filename for a token image URL. We hash
  // the path portion of the URL so two placements that share the same DDB
  // image collapse onto the same uploaded file.
  private static _tokenImageFilename(url: string): string {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+/, "");
    // Pull the basename, strip query/fragment.
    const base = path.split("/").pop() ?? "";
    const cleanedBase = base.split("?")[0].split("#")[0] || "token";
    // Add a short hash of the full path so distinct images with the same
    // basename don't collide.
    let hash = 0;
    for (let i = 0; i < path.length; i++) hash = ((hash << 5) - hash + path.charCodeAt(i)) | 0;
    const suffix = (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
    const dot = cleanedBase.lastIndexOf(".");
    const stem = dot > 0 ? cleanedBase.slice(0, dot) : cleanedBase;
    const ext = dot > 0 ? cleanedBase.slice(dot) : ".png";
    const safeStem = stem.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60) || "token";
    return `${safeStem}-${suffix}${ext}`;
  }

  // Download every unique token-image URL via the proxy and upload it to the
  // configured tokens directory. Returns a Map<url, localPath> for use by the
  // stub builder. Failures are logged and dropped from the map; callers must
  // handle the missing-key case (fall back to prototype texture).
  private static async _materialiseTokenImages(
    urls: string[],
    cobalt: string | null,
    campaignId: string | null,
    notify: (msg: string, pct?: number) => void,
  ): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (!urls.length) return out;
    const directory = DDBQuickplayTokens._tokenImageDirectory();
    try {
      await FileHelper.verifyPath(FileHelper.parseDirectory(directory));
    } catch (error) {
      logger.warn(`DDBQuickplayTokens: token image directory verify failed: ${(error as Error).message}`);
    }
    let done = 0;
    for (const url of urls) {
      done += 1;
      const pct = 0.7 + 0.1 * (done / urls.length);
      notify(`Downloading token image ${done}/${urls.length}`, pct);
      try {
        const blob = await DDBMaps.downloadTokenImage({ url, cobalt, campaignId });
        if (!blob) continue;
        const filename = DDBQuickplayTokens._tokenImageFilename(url);
        const localPath = await FileHelper.uploadImage(blob, directory, filename);
        if (localPath) out.set(url, localPath);
      } catch (error) {
        logger.warn(`DDBQuickplayTokens: token image fetch failed for ${url}: ${(error as Error).message}`);
      }
    }
    return out;
  }

  // Read scene-level layout context from flags + live scene properties.
  private static _readSceneContext(scene: Scene): {
    sceneScale: number;
    sceneXPad: number;
    sceneYPad: number;
    gridSize: number;
  } {
    const f: IDDBSceneFlags = scene?.flags?.["ddbimporter"] ?? {};
    const dims = scene.dimensions ?? {
      sceneX: 0,
      sceneY: 0,
    } as Scene.Dimensions;
    return {
      sceneScale: typeof f.gridSceneScale === "number" ? f.gridSceneScale : 1,
      sceneXPad: typeof dims.sceneX === "number" ? dims.sceneX : 0,
      sceneYPad: typeof dims.sceneY === "number" ? dims.sceneY : 0,
      gridSize: scene.grid?.size ?? 100,
    };
  }

  // Place tokens from a prepared state on the given scene. Returns counts so
  // the caller can report success/failure. Uses the same compendium-index
  // lookup pattern as AdventureMunch: match `entityId` against
  // `flags.ddbimporter.id` on the monster compendium.
  static async applyToScene(
    scene: Scene,
    state: IDDBPreparedState,
    options: IDDBQuickplayTokensApplyOptions = {},
  ): Promise<IDDBQuickplayTokensApplyResult> {
    const result: IDDBQuickplayTokensApplyResult = {
      tokensCreated: 0,
      tokensSkipped: 0,
      tokensFailed: 0,
      monstersImported: 0,
      monstersMissing: 0,
    };
    const tokenIds = state.tokens?.ids ?? [];
    const entities = state.tokens?.entities ?? {};
    if (!tokenIds.length) return result;

    const fallback = options.fallback ?? "skip";
    const duplicates = options.duplicates ?? "skip";
    const useDdbImage = !!options.useDdbImage;
    const externalNotify = options.notifier ?? (() => undefined);

    // Foundry V13 progress notification: a single bar that updates in place,
    // mirroring the maps batch import. We also forward each message to the
    // caller's notifier so log output stays continuous.
    let progressNote: any = null;
    try {
      progressNote = ui.notifications?.info?.(
        `Quickplay tokens: starting...`,
        { progress: true },
      );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      progressNote = null;
    }
    const notify = (message: string, pct?: number) => {
      externalNotify(message);
      try {
        progressNote?.update?.(pct === undefined ? { message } : { message, pct });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) { /* notification API unavailable, fall through */ }
    };

    const { sceneScale, sceneXPad, sceneYPad, gridSize } = DDBQuickplayTokens._readSceneContext(scene);

    // Duplicate detection: surface existing Quickplay tokens by quickplayTokenId.
    const existingByQpId = new Map<string, any>();
    for (const tokenDoc of (scene.tokens?.contents ?? [])) {
      const qpId = foundry.utils.getProperty(tokenDoc, "flags.ddbimporter.quickplayTokenId") as string | undefined;
      if (qpId) existingByQpId.set(qpId, tokenDoc);
    }
    if (existingByQpId.size && duplicates === "skip") {
      notify(`Scene already has ${existingByQpId.size} Quickplay token${existingByQpId.size === 1 ? "" : "s"}; skipping.`, 1);
      return result;
    }
    if (existingByQpId.size && duplicates === "replace") {
      notify(`Removing ${existingByQpId.size} existing Quickplay token${existingByQpId.size === 1 ? "" : "s"}...`, 0.05);
      try {
        await scene.deleteEmbeddedDocuments("Token", [...existingByQpId.values()].map((d) => d.id));
        existingByQpId.clear();
      } catch (error) {
        logger.warn(`DDBQuickplayTokens: failed to delete existing tokens: ${(error as Error).message}`);
      }
    }

    notify(`Resolving ${tokenIds.length} Quickplay token${tokenIds.length === 1 ? "" : "s"}...`, 0.1);

    // Phase A: deduplicate entityIds and ensure the monsters exist in the
    // compendium. AdventureMunchHelpers.loadMissingDocuments will fetch them
    // from DDB if the user has the right Patreon tier.
    let tokens = tokenIds.map((id) => entities[id]).filter(Boolean);
    // In "augment" mode, drop tokens that are already on the scene.
    if (duplicates === "augment" && existingByQpId.size) {
      const beforeCount = tokens.length;
      tokens = tokens.filter((t) => !existingByQpId.has(t.id));
      result.tokensSkipped += beforeCount - tokens.length;
    }
    if (!tokens.length) {
      notify(`No new tokens to place (${result.tokensSkipped} already present).`, 1);
      return result;
    }
    const ddbIds = [...new Set(tokens.map((t) => t.entityId).filter((id) => Number.isFinite(id)))] as number[];

    let monsterIndex: any = await AdventureMunchHelpers.getCompendiumIndex("monster");
    let presentIds = new Set<number>(
      [...monsterIndex]
        .map((m: any) => Number(foundry.utils.getProperty(m, "flags.ddbimporter.id")))
        .filter((n: number) => Number.isFinite(n)),
    );
    const missingIds = ddbIds.filter((id) => !presentIds.has(id));
    if (missingIds.length && !options.noAutoImport) {
      notify(`Importing ${missingIds.length} missing monster${missingIds.length === 1 ? "" : "s"} from DDB...`, 0.2);
      try {
        await AdventureMunchHelpers.loadMissingDocuments("monster", missingIds);
        // Refresh the index after import.
        monsterIndex = await AdventureMunchHelpers.getCompendiumIndex("monster");
        presentIds = new Set<number>(
          [...monsterIndex]
            .map((m: any) => Number(foundry.utils.getProperty(m, "flags.ddbimporter.id")))
            .filter((n: number) => Number.isFinite(n)),
        );
        result.monstersImported = missingIds.filter((id) => presentIds.has(id)).length;
      } catch (error) {
        logger.warn(`DDBQuickplayTokens: missing-monster import failed: ${(error as Error).message}`);
      }
    }
    result.monstersMissing = ddbIds.filter((id) => !presentIds.has(id)).length;

    // Phase B: ensure a world actor exists for each entityId. We materialise
    // them via game.actors.importFromCompendium so tokens can carry a stable
    // actorId. Reuses the same pattern as AdventureMunch.ensureWorldActors.
    const monsterCompendium = CompendiumHelper.getCompendiumType("monster", false) as CompendiumCollection<"Actor"> | null;
    const actorFolderId = await DDBQuickplayTokens._resolveActorFolderId(options.actorFolderPath ?? null);
    const actorByDdbId = new Map<number, Actor<"npc">>();
    const totalActors = ddbIds.length;
    let actorsDone = 0;
    notify(`Materialising ${totalActors} actor${totalActors === 1 ? "" : "s"}...`, 0.4);
    for (const ddbId of ddbIds) {
      const monsterEntry = monsterIndex.find(
        (m: any) => Number(foundry.utils.getProperty(m, "flags.ddbimporter.id")) === ddbId,
      );
      if (!monsterEntry) continue;
      // Prefer existing world actor with the same DDB id (avoids duplicates).
      const existing: Actor<"npc"> = (game.actors?.contents ?? []).find((a: any) =>
        Number(foundry.utils.getProperty(a, "flags.ddbimporter.id")) === ddbId,
      ) as unknown as Actor<"npc">;
      if (existing) {
        actorByDdbId.set(ddbId, existing);
        continue;
      }
      try {
        const updateData: Record<string, unknown> = {};
        if (actorFolderId) updateData.folder = actorFolderId;
        const worldActor = await game.actors.importFromCompendium(
          monsterCompendium,
          monsterEntry._id,
          updateData,
          { keepId: false, keepEmbeddedIds: true },
        ) as unknown as Actor<"npc">;
        if (worldActor) actorByDdbId.set(ddbId, worldActor);
      } catch (error) {
        logger.warn(`DDBQuickplayTokens: failed to import actor ${ddbId}: ${(error as Error).message}`);
      }
      actorsDone += 1;
      // 0.4 - 0.7 reserved for actor materialisation.
      const pct = totalActors ? 0.4 + (0.3 * actorsDone) / totalActors : 0.7;
      notify(`Materialised actor ${actorsDone}/${totalActors}`, pct);
    }

    // Phase B.5: download + locally host token images so Foundry's canvas
    // can load them. DDB's per-placement imageUrl values can't be loaded
    // directly (CORS / auth) so we proxy them and rehost via FileHelper.
    let tokenImageByUrl = new Map<string, string>();
    if (useDdbImage) {
      const uniqueUrls = [...new Set(
        tokens
          .map((t) => t.imageUrl ?? t.fallbackImageUrl ?? null)
          .filter((u): u is string => typeof u === "string" && u.length > 0),
      )];
      if (uniqueUrls.length) {
        notify(`Importing ${uniqueUrls.length} token image${uniqueUrls.length === 1 ? "" : "s"}...`, 0.7);
        tokenImageByUrl = await DDBQuickplayTokens._materialiseTokenImages(
          uniqueUrls,
          options.cobalt ?? null,
          options.campaignId ?? null,
          notify,
        );
      }
    }

    // Phase C: build a token document per placement.
    const tokenData: any[] = [];
    for (const t of tokens) {
      const worldActor = actorByDdbId.get(t.entityId);
      if (!worldActor) {
        if (fallback === "skip") {
          result.tokensSkipped += 1;
          continue;
        }
        // fallback === "placeholder": create an actor-less token. Foundry
        // doesn't support this directly for player-owned scenes; we only
        // include name/position so it shows up as a marker.
      }
      const centre = DDBQuickplayTokens._centreCanvas(t, state, sceneScale, sceneXPad, sceneYPad);
      // Compose a display name. DDB carries the base name plus an optional
      // suffix (e.g. "A", "B", "1") used to disambiguate duplicates in an
      // encounter. Prefer `displayName` when present (already includes the
      // suffix), otherwise concat name + suffix manually.
      const baseName = t.displayName ?? (t.nameSuffix ? `${t.name} ${t.nameSuffix}` : t.name);
      // Convert centre to top-left using the prototype token's size in
      // cells. Foundry token.x/y is the top-left of the occupied area; the
      // centre lives at top-left + (size * gridSize) / 2. Snapping the
      // centre directly to a grid line (the old behaviour) places the
      // top-left a half-cell past the desired position, so 1x1 and 3x3
      // tokens with centres at half-cell offsets ended up one cell down
      // and right of where DDB had placed them.
      // Snap the token to the grid cell whose area it most overlaps. The
      // Foundry grid runs in canvas coords starting at (0, 0); sceneXPad /
      // sceneYPad are the image-origin offset, NOT the grid origin.
      //
      // For tokens >= 1 cell (Medium, Large, Huge, etc.) we use the
      // standard round((centre - halfSize) / gridSize) * gridSize, which
      // picks the cell/block that maximises area overlap.
      //
      // For sub-cell tokens (Tiny with width 0.5) that formula has a
      // different threshold: with halfSize = gridSize/4, the rounding flip
      // sits at 75% into a cell instead of at the cell boundary, so a
      // Tiny token whose centre lands past the midpoint of its cell
      // ends up one cell down/right of where it should sit. Snap those
      // by finding the cell containing the centre and placing the token's
      // visual centre at that cell's centre - keeps Tiny tokens in the
      // cell DDB shows them in.
      const rawProtoWidth = Number(worldActor?.prototypeToken?.width);
      const rawProtoHeight = Number(worldActor?.prototypeToken?.height);
      const protoWidth = Number.isFinite(rawProtoWidth) && rawProtoWidth > 0 ? rawProtoWidth : 1;
      const protoHeight = Number.isFinite(rawProtoHeight) && rawProtoHeight > 0 ? rawProtoHeight : 1;
      const halfW = (protoWidth * gridSize) / 2;
      const halfH = (protoHeight * gridSize) / 2;
      let stubX: number;
      let stubY: number;
      if (protoWidth < 1 || protoHeight < 1) {
        const cellX = Math.floor(centre.x / gridSize);
        const cellY = Math.floor(centre.y / gridSize);
        stubX = Math.round(cellX * gridSize + gridSize / 2 - halfW);
        stubY = Math.round(cellY * gridSize + gridSize / 2 - halfH);
      } else {
        stubX = Math.round((centre.x - halfW) / gridSize) * gridSize;
        stubY = Math.round((centre.y - halfH) / gridSize) * gridSize;
      }
      const stub: ITokenStub = {
        x: stubX,
        y: stubY,
        hidden: !!t.hidden,
        locked: !!t.locked,
        name: baseName,
        level: DEFAULT_LEVEL_ID,
        sort: Math.round((t.zPosition ?? 0) * 1000),
        flags: {
          "ddbimporter": {
            quickplayTokenId: t.id,
            ddbEntityId: t.entityId,
            ddbType: t.type,
            sourceName: t.sourceName ?? null,
            rawPosition: t.position,
            rawZPosition: t.zPosition ?? 0,
            rawHidden: !!t.hidden,
            ddbImageUrl: t.imageUrl ?? null,
          },
        },
      };
      // HP overrides: DDB carries an `hpInfo` per placement which can differ
      // from the actor's prototype (encounter-tweaked monsters). Fold them
      // into delta.system.attributes.hp so this specific token reflects them
      // without mutating the world actor.
      if (t.hpInfo) {
        const hp: any = {};
        if (typeof t.hpInfo.current === "number") hp.value = t.hpInfo.current;
        if (typeof t.hpInfo.maxOverride === "number" && t.hpInfo.maxOverride > 0) hp.max = t.hpInfo.maxOverride;
        else if (typeof t.hpInfo.max === "number" && t.hpInfo.max > 0) hp.max = t.hpInfo.max;
        if (typeof t.hpInfo.temp === "number") hp.temp = t.hpInfo.temp;
        if (Object.keys(hp).length) {
          stub.delta = { system: { attributes: { hp } } };
        }
      }
      // Texture override: use the locally-hosted copy of the DDB placement
      // art rather than the original CDN URL (which Foundry can't load due to
      // CORS / auth) and rather than the prototype avatar.
      if (useDdbImage) {
        const sourceUrl = t.imageUrl ?? t.fallbackImageUrl ?? null;
        const localPath = sourceUrl ? tokenImageByUrl.get(sourceUrl) : null;
        if (localPath) stub.texture = { src: localPath };
      }

      try {
        if (worldActor) {
          const doc = await worldActor.getTokenDocument(stub as any);
          const data = doc.toObject() as unknown as I5ePrototypeToken;
          // getTokenDocument respects most stub fields but resets texture.src
          // back to the prototype on some paths; reapply explicitly.
          if (stub.texture?.src) {
            data.texture = { ...(data.texture ?? {}), src: stub.texture.src };
          }
          tokenData.push(data);
        } else if (fallback === "placeholder") {
          tokenData.push({
            ...stub,
            width: 1,
            height: 1,
            // No actorId on purpose - Foundry will warn but allow visualisation.
          });
        }
      } catch (error) {
        logger.warn(`DDBQuickplayTokens: failed to build token "${t.name}": ${(error as Error).message}`);
        result.tokensFailed += 1;
      }
    }

    if (!tokenData.length) {
      notify(`No tokens to place (${result.tokensSkipped} skipped, ${result.tokensFailed} failed).`, 1);
      return result;
    }

    notify(`Placing ${tokenData.length} token${tokenData.length === 1 ? "" : "s"} on scene...`, 0.85);
    try {
      const created = await scene.createEmbeddedDocuments("Token", tokenData as any);
      result.tokensCreated += Array.isArray(created) ? created.length : 0;
    } catch (error) {
      logger.error(`DDBQuickplayTokens: createEmbeddedDocuments failed: ${(error as Error).message}`, error);
      result.tokensFailed += tokenData.length;
    }

    notify(`Placed ${result.tokensCreated} token${result.tokensCreated === 1 ? "" : "s"} on "${scene.name}".`, 1);
    logger.info(`DDBQuickplayTokens: applied to "${scene.name}":`, result);
    return result;
  }

}
