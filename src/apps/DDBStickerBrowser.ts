import DDBAppV2 from "./DDBAppV2";
import { logger, utils, DDBCampaigns, Secrets } from "../lib/_module";
import { SETTINGS } from "../config/_module";
import DDBMaps from "../muncher/DDBMaps";
import DDBStickers from "../muncher/DDBStickers";
import DDBSticker from "../muncher/adventure/DDBSticker";

interface IStickerStorage {
  payload: IDDBStickersPayload | null;
  fetchedAt: number | null;
}

// DDB sources whose stickers don't have any maps and so don't appear in the
// `getEntitledOfficialSources` catalog. Maintain by hand - if new sticker-
// only packs ship, add them here. The path-slug fallback in
// _sourceNameFor() handles unknown ones with a reasonable guess.
const STICKER_ONLY_SOURCE_NAMES: Record<number, string> = {
  148: "Basic Stickers",
  231: "Monthly Subscription Stickers",
  272: "DDB Drops",
};

function prettifySlug(slug: string): string {
  // "br-2024" -> "Br 2024", "marchsub2026" -> "Marchsub 2026", "DDBD" -> "DDBD".
  // Splits on hyphens/underscores and inserts a space between letter-digit
  // boundaries; preserves all-caps slugs (acronyms).
  if ((/^[A-Z0-9]+$/).test(slug)) return slug;
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ensureStorage(): IStickerStorage {
  if (!CONFIG.DDBI.STICKERS) CONFIG.DDBI.STICKERS = { payload: null, fetchedAt: null };
  return CONFIG.DDBI.STICKERS;
}

export default class DDBStickerBrowser extends DDBAppV2 {

  selectedSourceId: number | null = null;
  selectedKeyword: string | null = null;
  searchTerm = "";
  loading = false;
  private _searchDebounce: ((...args: any[]) => void) | null = null;
  private _searchCaret: { start: number; end: number } | null = null;
  // Same lazy-fetch pattern as DDBMapBrowser: populate the dropdown on first
  // render, fall through to a text input when the fetch fails.
  private _campaigns: any[] | null = null;
  private _campaignFetchInFlight = false;
  private _placementInFlight = false;

  static DEFAULT_OPTIONS = {
    id: "ddb-sticker-browser",
    classes: ["dnd5e2", "ddb-sticker-browser"],
    window: {
      title: "DDB Sticker Browser",
      icon: "fas fa-shapes",
      resizable: true,
      minimizable: true,
    },
    actions: {
      reloadCatalog: DDBStickerBrowser.reloadCatalog,
      selectSource: DDBStickerBrowser.selectSource,
      selectKeyword: DDBStickerBrowser.selectKeyword,
      clearFilters: DDBStickerBrowser.clearFilters,
      importSticker: DDBStickerBrowser.importSticker,
      importAllVisible: DDBStickerBrowser.importAllVisible,
      placeSticker: DDBStickerBrowser.placeSticker,
      close: DDBStickerBrowser.cancel,
    },
    position: { width: 1100, height: 720 },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/sticker-browser/browser.hbs",
    },
  };

  _getTabs() {
    return {};
  }

  static async reloadCatalog(this: DDBStickerBrowser, _event, _target) {
    await this._loadCatalog({ force: true });
  }

  static async selectSource(this: DDBStickerBrowser, _event, target) {
    const raw = target?.dataset?.sourceId;
    this.selectedSourceId = raw == null || raw === "" ? null : Number(raw);
    await this.render();
  }

  static async selectKeyword(this: DDBStickerBrowser, _event, target) {
    const kw = target?.dataset?.keyword || null;
    this.selectedKeyword = this.selectedKeyword === kw ? null : kw;
    await this.render();
  }

  static async clearFilters(this: DDBStickerBrowser) {
    this.selectedSourceId = null;
    this.selectedKeyword = null;
    this.searchTerm = "";
    await this.render();
  }

  static async importSticker(this: DDBStickerBrowser, _event, target) {
    const id = target?.dataset?.stickerId;
    if (!id) return;
    const storage = ensureStorage();
    const sticker = storage.payload?.stickers.find((s) => s.gameElementUri === id);
    if (!sticker) {
      ui.notifications.error("Could not locate sticker; reload the catalog and try again.");
      return;
    }
    await this._importStickers([sticker]);
  }

  static async placeSticker(this: DDBStickerBrowser, _event, target) {
    if (this._placementInFlight) {
      ui.notifications.info("A sticker placement is already in progress.");
      return;
    }
    if (!canvas?.ready || !canvas.scene) {
      ui.notifications.warn("No active scene; activate a scene before placing a sticker.");
      return;
    }
    const id = target?.dataset?.stickerId;
    if (!id) return;
    const storage = ensureStorage();
    const sticker = storage.payload?.stickers.find((s) => s.gameElementUri === id);
    if (!sticker) {
      ui.notifications.error("Could not locate sticker; reload the catalog and try again.");
      return;
    }

    this._placementInFlight = true;
    try {
      const imagePath = await this._ensureStickerOnDisk(sticker);
      if (!imagePath) return;
      await this._beginTilePlacement(imagePath, sticker);
    } finally {
      this._placementInFlight = false;
    }
  }

  static async importAllVisible(this: DDBStickerBrowser) {
    const visible = this._visibleStickers();
    if (!visible.length) {
      ui.notifications.warn("No stickers match the current filter.");
      return;
    }
    await this._importStickers(visible);
  }

  static async cancel(this: DDBStickerBrowser) {
    await this.close();
  }

  async _loadCatalog({ force = false } = {}) {
    const storage = ensureStorage();
    if (!force && storage.payload) return storage.payload;
    if (this.loading) return null;
    try {
      this.loading = true;
      await this.render();

      // Pull the maps catalog in parallel so source-id -> name lookup works
      // for set folder labels even when the user hasn't opened the Map
      // Browser this session. Failure here is non-fatal - we just fall back
      // to "Source <id>" labels.
      const catalogTask = (async () => {
        if (!CONFIG.DDBI.MAPS?.catalog) {
          try {
            const catalog = await DDBMaps.fetchCatalog();
            if (catalog) {
              CONFIG.DDBI.MAPS = CONFIG.DDBI.MAPS ?? { catalog: null, sourceMaps: {}, fetchedAt: null };
              CONFIG.DDBI.MAPS.catalog = catalog;
              CONFIG.DDBI.MAPS.fetchedAt = Date.now();
            }
          } catch (error) {
            logger.warn(`DDBStickerBrowser: maps catalog prefetch failed: ${(error as Error).message}`);
          }
        }
      })();

      const [, payload] = await Promise.all([catalogTask, DDBStickers.fetchAll()]);
      storage.payload = payload;
      storage.fetchedAt = Date.now();
      return payload;
    } catch (error) {
      logger.error("DDBStickerBrowser: catalog fetch failed", error);
      ui.notifications.error(`Sticker catalog fetch failed: ${error.message}`);
      return null;
    } finally {
      this.loading = false;
      await this.render();
    }
  }

  // Apply source + keyword + search filters to the cached payload.
  _visibleStickers(): IDDBSticker[] {
    const storage = ensureStorage();
    const all = storage.payload?.stickers ?? [];
    const search = this.searchTerm.trim().toLowerCase();
    return all.filter((s) => {
      if (this.selectedSourceId !== null && s.primarySourceId !== this.selectedSourceId) return false;
      if (this.selectedKeyword && !(s.keywords ?? []).includes(this.selectedKeyword)) return false;
      if (search) {
        const hay = `${s.name} ${s.altText ?? ""} ${(s.keywords ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  // Resolve a friendly label for a primarySourceId. Resolution order:
  //   1) Maps catalog from `getEntitledOfficialSources` (covers map packs,
  //      sourcebooks, adventures with associated stickers).
  //   2) Hardcoded names for sticker-only sources that don't appear in the
  //      maps catalog (Basic Stickers, Drops, monthly subs).
  //   3) CONFIG.DDB.sources - fallback for sources missing from the proxy's
  //      cached maps catalog (newer releases). Loaded eagerly at game ready
  //      from /api/config/json, so it has the latest source list.
  //   4) Path-slug derivation from any sticker's imageKey - turns folder
  //      slugs like "marchsub2026" into "Marchsub 2026" so newly added
  //      sticker packs still get a sensible label without a code change.
  //   5) "Source N" final fallback.
  _sourceNameFor(sourceId: number): string {
    const mapsCatalog = CONFIG.DDBI.MAPS?.catalog;
    const match = mapsCatalog?.sources.find((s) => Number(s.sourceId) === sourceId);
    if (match) return (match.description ?? match.name ?? "").toString();
    const known = STICKER_ONLY_SOURCE_NAMES[sourceId];
    if (known) return known;
    const ddbSource = (CONFIG.DDB?.sources ?? []).find((s: any) => Number(s.id) === sourceId);
    if (ddbSource) return (ddbSource.description ?? ddbSource.name ?? "").toString();
    const slug = this._pathSlugForSource(sourceId);
    if (slug && slug !== "stickers") return prettifySlug(slug);
    return `Source ${sourceId}`;
  }

  // Pull a path slug like "br-2024" or "marchsub2026" from any sticker in
  // this source. Returns null when stickers in this source live in the flat
  // `official/stickers/<filename>.png` namespace (slug = "stickers").
  _pathSlugForSource(sourceId: number): string | null {
    const storage = ensureStorage();
    const sample = (storage.payload?.stickers ?? []).find((s) => s.primarySourceId === sourceId);
    if (!sample) return null;
    const path = sample.entitledData?.imageKey ?? sample.thumbnailKey ?? "";
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return parts[parts.length - 2];
  }

  async _importStickers(stickers: IDDBSticker[]) {
    if (!stickers.length) return;
    const total = stickers.length;
    const progressNote: any = ui.notifications.info(`Importing 0/${total} stickers...`, { progress: true });
    const progressUpdate = (msg: string, pct: number) => {
      try {
        progressNote?.update?.({ message: msg, pct });
      } catch (_e) { /* fallthrough */ }
    };

    const items = stickers.map((s) => ({
      sticker: s,
      options: {
        notifier: (msg: string) => logger.debug(msg),
        setName: typeof s.primarySourceId === "number" ? this._sourceNameFor(s.primarySourceId) : null,
      },
    }));

    let ok = 0;
    let skipped = 0;
    let failed = 0;
    progressUpdate(`Importing 0/${total} stickers...`, 0);

    await DDBSticker.importBatch(items, (info) => {
      if (info.error) {
        failed += 1;
      } else if (info.result?.skipped) {
        skipped += 1;
      } else if (info.result?.imagePath) {
        ok += 1;
      } else {
        failed += 1;
      }
      progressUpdate(`Imported ${info.index}/${info.total}: ${info.sticker.name}`, info.index / info.total);
    });

    progressUpdate(
      `Imported ${ok} sticker${ok === 1 ? "" : "s"}`
        + (skipped ? ` (skipped ${skipped})` : "")
        + (failed ? ` (${failed} failed)` : ""),
      1,
    );
    if (failed) ui.notifications.warn(`${failed} sticker${failed === 1 ? "" : "s"} failed to import; see console.`);
  }

  private async _ensureStickerOnDisk(sticker: IDDBSticker): Promise<string | null> {
    const setName = typeof sticker.primarySourceId === "number"
      ? this._sourceNameFor(sticker.primarySourceId)
      : null;

    const options = { notifier: (msg: string) => logger.debug(msg), setName };
    const ddbSticker = new DDBSticker(sticker, options);
    const exitsLocally = await ddbSticker.existsLocally();
    if (exitsLocally) {
      logger.debug(`DDBStickerBrowser: sticker "${sticker.name}" already exists locally, skipping download/upload`);
      ui.notifications.info(`Sticker "${sticker.name}" already exists on disk; skipping download/upload.`);
      const url = await ddbSticker.getLocalUrl();
      return url;
    }

    const note: any = ui.notifications.info(`Importing sticker "${sticker.name}"...`, { progress: true });
    const progressUpdate = (msg: string, pct: number) => {
      try {
        note?.update?.({ message: msg, pct });
      } catch (_e) { /* ignore */ }
    };
    progressUpdate(`Downloading "${sticker.name}"...`, 0.1);
    const result = await ddbSticker.import();

    if (!result || !result.imagePath) {
      ui.notifications.error(
        `Failed to import sticker "${sticker.name}"${result?.reason ? ` (${result.reason})` : ""}.`,
      );
      progressUpdate(`Failed: ${sticker.name}`, 1);
      return null;
    }
    progressUpdate(`Imported "${sticker.name}"`, 1);
    return result.imagePath;
  }

  private async _beginTilePlacement(imagePath: string, sticker: IDDBSticker): Promise<void> {
    let tex: any;
    try {
      tex = await foundry.canvas.loadTexture(imagePath);
    } catch (error) {
      ui.notifications.error(`Failed to load sticker texture: ${(error as Error).message}`);
      return;
    }
    const texWidth = tex?.baseTexture?.width || 0;
    if (!texWidth) {
      ui.notifications.error("Sticker texture has no width; cannot compute tile size.");
      return;
    }

    const texHeight = tex?.baseTexture?.height || texWidth;
    const scale = typeof sticker.entitledData?.scale === "number" && sticker.entitledData.scale > 0
      ? sticker.entitledData.scale
      : 1;
    const tileSize = texWidth / scale;
    const gridSize = canvas.grid?.size ?? 100;
    const tileWidth = scale * gridSize;
    const tileHeight = tileWidth * (texHeight / texWidth);

    const restoreFn = await this._minimizeAllWindows();
    const hintNote: any = ui.notifications.info(
      `Click to place "${sticker.name}". Shift+Wheel = resize, Ctrl+Wheel = rotate, Alt-click = hidden. Escape / right-click cancels.`,
    );

    try {
      await this._awaitPlacement(imagePath, tileSize, tex, tileWidth, tileHeight);
    } catch (error) {
      logger.warn(`DDBStickerBrowser: placement aborted: ${(error as Error).message}`);
    } finally {
      try {
        hintNote?.remove?.();
      } catch (_e) { /* ignore */ }
      await restoreFn();
    }
  }

  private async _minimizeAllWindows(): Promise<() => Promise<void>> {
    const v2Apps = Array.from(
      (foundry.applications?.instances as Map<string, any>)?.values?.() ?? [],
    );
    const v2State = v2Apps.map((app) => ({
      app,
      wasMinimized: !!app.minimized,
      minimizable: !!app.options?.window?.minimizable,
      rendered: !!app.rendered,
    }));

    const v1Apps = Object.values(ui.windows ?? {}) as any[];
    const v1State = v1Apps.map((app) => ({
      app,
      wasMinimized: app._minimized === true,
      popOut: !!app.popOut,
      rendered: !!app.rendered,
    }));

    await Promise.all([
      ...v2State.map(({ app, wasMinimized, minimizable, rendered }) => {
        if (wasMinimized || !minimizable || !rendered) return Promise.resolve();
        return Promise.resolve(app.minimize()).catch(() => undefined);
      }),
      ...v1State.map(({ app, wasMinimized, popOut, rendered }) => {
        if (wasMinimized || !popOut || !rendered) return Promise.resolve();
        return Promise.resolve(app.minimize()).catch(() => undefined);
      }),
    ]);

    return async () => {
      await Promise.all([
        ...v2State.map(({ app, wasMinimized }) => {
          if (wasMinimized || !app.rendered) return Promise.resolve();
          return Promise.resolve(app.maximize()).catch(() => undefined);
        }),
        ...v1State.map(({ app, wasMinimized }) => {
          if (wasMinimized || !app.rendered) return Promise.resolve();
          return Promise.resolve(app.maximize()).catch(() => undefined);
        }),
      ]);
      try {
        (this as any).bringToFront?.();
      } catch (_e) { /* ignore */ }
    };
  }

  private _awaitPlacement(
    imagePath: string,
    _tileSize: number,
    texture: any,
    tileWidth: number,
    tileHeight: number,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const view = canvas.app?.view as HTMLCanvasElement | undefined;
      if (!view) {
        reject(new Error("Canvas view unavailable"));
        return;
      }

      // Mutable placement state. shift+wheel scales; ctrl+wheel rotates.
      let currentWidth = tileWidth;
      let currentHeight = tileHeight;
      let currentRotation = 0;

      // Cursor-follow ghost. Attached to the tiles layer's preview container
      // so it shares the layer's transform (zoom/pan track for free).
      const previewContainer = canvas.tiles?.preview;
      let ghost: any = null;
      try {
        if (previewContainer && window.PIXI && texture) {
          ghost = new window.PIXI.Sprite(texture);
          ghost.anchor?.set?.(0.5, 0.5);
          ghost.width = currentWidth;
          ghost.height = currentHeight;
          ghost.alpha = 0.6;
          ghost.eventMode = "none";
          ghost.zIndex = 9999;
          previewContainer.addChild(ghost);
        }
      } catch (error) {
        logger.warn(`DDBStickerBrowser: preview sprite failed: ${(error as Error).message}`);
        ghost = null;
      }

      const positionGhost = (clientX: number, clientY: number) => {
        if (!ghost) return;
        try {
          const { x, y } = canvas.canvasCoordinatesFromClient({ x: clientX, y: clientY });
          ghost.position?.set?.(x, y);
        } catch (_e) { /* ignore */ }
      };

      const refreshGhost = () => {
        if (!ghost) return;
        try {
          ghost.width = currentWidth;
          ghost.height = currentHeight;
          ghost.rotation = (currentRotation * Math.PI) / 180;
        } catch (_e) { /* ignore */ }
      };

      let settled = false;
      const cleanup = () => {
        if (settled) return;
        settled = true;
        view.removeEventListener("pointerdown", onPointerDown, true);
        view.removeEventListener("pointermove", onPointerMove, true);
        view.removeEventListener("wheel", onWheel, true);
        view.removeEventListener("contextmenu", onContextMenu, true);
        document.removeEventListener("keydown", onKeyDown, true);
        Hooks.off("canvasInit", onCanvasInit);
        if (ghost) {
          try {
            ghost.parent?.removeChild?.(ghost);
            ghost.destroy?.({ children: true });
          } catch (_e) { /* ignore */ }
          ghost = null;
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        positionGhost(event.clientX, event.clientY);
      };

      const onWheel = (event: WheelEvent) => {
        // Only intercept when shift or ctrl is held; otherwise let Foundry
        // handle the wheel (zoom/pan).
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        event.stopPropagation();
        // macOS browsers re-route vertical wheel to deltaX when shift is held;
        // fall back to deltaX if deltaY is zero.
        const rawDelta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
        if (rawDelta === 0) return;
        const dir = rawDelta < 0 ? 1 : -1; // wheel up = positive
        if (event.shiftKey) {
          const factor = dir > 0 ? 1.1 : 1 / 1.1;
          currentWidth = Math.max(8, currentWidth * factor);
          currentHeight = Math.max(8, currentHeight * factor);
        } else if (event.ctrlKey || event.metaKey) {
          currentRotation = (currentRotation + dir * 15) % 360;
        }
        refreshGhost();
      };

      const onPointerDown = async (event: PointerEvent) => {
        if (event.button !== 0) return;
        cleanup();
        event.preventDefault();
        event.stopPropagation();
        try {
          const cursor = canvas.canvasCoordinatesFromClient({ x: event.clientX, y: event.clientY });
          // v14: tile.x/y is the texture anchor point. Default texture anchor
          // is 0.5/0.5, so tile.x/y = the center of the tile (matches the
          // centered ghost preview).
          let x = cursor.x;
          let y = cursor.y;
          if (!event.shiftKey) {
            const snapped = canvas.tiles.getSnappedPoint({ x, y });
            x = snapped.x;
            y = snapped.y;
          }
          const TileDocCls = foundry.utils.getDocumentClass("Tile");
          const createData: any = {
            texture: { src: imagePath },
            x,
            y,
            width: currentWidth,
            height: currentHeight,
            rotation: currentRotation,
            sort: Math.max((canvas.tiles.getMaxSort?.() ?? 0) + 1, 0),
            hidden: !!event.altKey,
          };
          const syntheticEvent = {
            clientX: event.clientX,
            clientY: event.clientY,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            preventDefault() { /* noop */ },
            stopPropagation() { /* noop */ },
          };
          // @ts-expect-error - allowed
          const allowed = Hooks.call(
            "dropCanvasData",
            canvas,
            { type: "Tile", ...createData },
            syntheticEvent,
          );
          if (allowed === false) {
            resolve(null);
            return;
          }
          if (!canvas.dimensions.rect.contains(x, y)) {
            ui.notifications.warn("Placement outside scene bounds; tile not created.");
            resolve(null);
            return;
          }
          const created = await TileDocCls.create(createData, { parent: canvas.scene });
          resolve(created);
        } catch (error) {
          reject(error);
        }
      };

      const onContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        cleanup();
        resolve(null);
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        cleanup();
        resolve(null);
      };

      const onCanvasInit = () => {
        cleanup();
        resolve(null);
      };

      view.addEventListener("pointerdown", onPointerDown, true);
      view.addEventListener("pointermove", onPointerMove, true);
      view.addEventListener("wheel", onWheel, { capture: true, passive: false });
      view.addEventListener("contextmenu", onContextMenu, true);
      document.addEventListener("keydown", onKeyDown, true);
      Hooks.on("canvasInit", onCanvasInit);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext({ ...options, noCacheLoad: true });
    const storage = ensureStorage();
    const all = storage.payload?.stickers ?? [];

    const sourceCounts = new Map<number, number>();
    const keywordCounts = new Map<string, number>();
    for (const s of all) {
      const sid = typeof s.primarySourceId === "number" ? s.primarySourceId : -1;
      sourceCounts.set(sid, (sourceCounts.get(sid) ?? 0) + 1);
      for (const k of s.keywords ?? []) {
        keywordCounts.set(k, (keywordCounts.get(k) ?? 0) + 1);
      }
    }

    const sources = [...sourceCounts.entries()]
      .map(([id, count]) => ({
        id,
        name: id < 0 ? "Unknown" : this._sourceNameFor(id),
        count,
        selected: this.selectedSourceId === id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const keywords = [...keywordCounts.entries()]
      .map(([name, count]) => ({ name, count, selected: this.selectedKeyword === name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const visible = this._visibleStickers();
    const stickers = visible.map((s) => ({
      id: s.gameElementUri,
      name: s.name,
      altText: s.altText ?? "",
      keywords: s.keywords ?? [],
      keywordsLabel: (s.keywords ?? []).join(", "),
      thumbnail: typeof s.thumbnail === "string" ? s.thumbnail : null,
      aspectRatio: s.entitledData?.aspectRatio ?? null,
      scaleLabel: typeof s.entitledData?.scale === "number"
        ? `${s.entitledData.scale.toFixed(2)} sq`
        : null,
    }));

    const selectedCampaignId = (utils.getSetting<string>("ddb-maps-campaign-id") ?? "").toString().trim();
    if (this._campaigns === null && !this._campaignFetchInFlight) {
      this._campaignFetchInFlight = true;
      this._loadCampaigns().then(() => {
        this._campaignFetchInFlight = false;
        this.render();
      }).catch((_e) => {
        this._campaignFetchInFlight = false;
        this._campaigns = [];
        this.render();
      });
    }

    Object.assign(context, {
      hasCatalog: !!storage.payload,
      loading: this.loading,
      fetchedAt: storage.fetchedAt ? new Date(storage.fetchedAt).toLocaleTimeString() : null,
      total: all.length,
      visibleCount: visible.length,
      sources,
      keywords,
      stickers,
      searchTerm: this.searchTerm,
      anyFilter: this.selectedSourceId !== null || this.selectedKeyword !== null || this.searchTerm.trim() !== "",
      selectedCampaignId,
      campaigns: (this._campaigns ?? []).map((c) => ({
        ...c,
        selected: String(c.id) === selectedCampaignId,
      })),
      canLoadCatalog: selectedCampaignId !== "" && !this.loading,
    });
    logger.debug("DDBStickerBrowser context prepared", context);
    return context;
  }

  async _loadCampaigns() {
    try {
      const cobalt = Secrets.getCobalt();
      const list = await DDBCampaigns.getDDBCampaigns(cobalt);
      this._campaigns = Array.isArray(list) ? list : [];
    } catch (error) {
      logger.warn(`DDBStickerBrowser: campaign fetch failed: ${(error as Error).message}`);
      this._campaigns = [];
    }
  }

  async _setStickersCampaignId(value: string) {
    const cleaned = (value ?? "").toString().trim();
    await game.settings.set(SETTINGS.MODULE_ID, "ddb-maps-campaign-id", cleaned);
    await this.render();
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    // Only auto-load when a campaign id is already set; otherwise wait for
    // the user to pick one.
    const campaignId = (utils.getSetting<string>("ddb-maps-campaign-id") ?? "").toString().trim();
    if (!ensureStorage().payload && campaignId !== "") this._loadCatalog();
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll<HTMLSelectElement>(".ddb-sticker-browser-campaign-select").forEach((sel) => {
      sel.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLSelectElement;
        this._setStickersCampaignId(el.value);
      });
    });
    this.element.querySelectorAll<HTMLInputElement>(".ddb-sticker-browser-campaign-input").forEach((inp) => {
      inp.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setStickersCampaignId(el.value);
      });
    });

    const input = this.element.querySelector("#sticker-browser-search") as HTMLInputElement | null;
    if (!input) return;

    if (this._searchCaret) {
      input.focus();
      const { start, end } = this._searchCaret;
      try {
        input.setSelectionRange(start, end);
      } catch (_e) { /* ignore */ }
      this._searchCaret = null;
    }

    if (!this._searchDebounce) {
      this._searchDebounce = foundry.utils.debounce(() => this.render(), 200);
    }
    input.addEventListener("input", (event: any) => {
      const el = event.target as HTMLInputElement;
      this.searchTerm = el.value ?? "";
      this._searchCaret = {
        start: el.selectionStart ?? this.searchTerm.length,
        end: el.selectionEnd ?? this.searchTerm.length,
      };
      this._searchDebounce!();
    });
  }

}
