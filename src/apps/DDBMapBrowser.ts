import DDBAppV2 from "./DDBAppV2";
import { logger, utils, DDBCampaigns, Secrets } from "../lib/_module";
import { SETTINGS } from "../config/_module";
import DDBMaps from "../muncher/DDBMaps";
import DDBMap from "../muncher/adventure/DDBMap";
import DDBMapMetaData from "../muncher/adventure/DDBMapMetaData";

const TYPE_ORDER = ["basic", "subscription", "mappack", "sourcebook", "adventure"];
const TYPE_LABELS: Record<string, string> = {
  basic: "Essentials",
  subscription: "Subscription Maps",
  mappack: "Map Packs",
  sourcebook: "Sourcebooks",
  adventure: "Adventures",
};

interface IBrowserSelection {
  sourceId: string;
  chapterId: string | null;
}

function sourceKey(sel: IBrowserSelection): string {
  return sel.chapterId ? `${sel.sourceId}::${sel.chapterId}` : sel.sourceId;
}

function emptyMapsStorage() {
  return { catalog: null, sourceMaps: {}, fetchedAt: null };
}

function isDmMap(map: { description?: string; name?: string }): boolean {
  const haystack = `${map.description ?? ""} ${map.name ?? ""}`.toLowerCase();
  return haystack.includes("dm version");
}

function ensureMapsStorage() {
  if (!CONFIG.DDBI.MAPS) CONFIG.DDBI.MAPS = emptyMapsStorage();
  return CONFIG.DDBI.MAPS;
}


export default class DDBMapBrowser extends DDBAppV2 {

  selection: IBrowserSelection | null = null;
  searchTerm = "";
  loadingCatalog = false;
  loadingSource = false;
  expandedTypes = new Set<string>();
  expandedSources = new Set<string>();
  private _searchDebounce: ((...args: any[]) => void) | null = null;
  private _searchCaret: { start: number; end: number } | null = null;
  // Cached list of campaigns the user is a member of, fetched lazily on
  // first render. Lets us populate the campaign dropdown without forcing a
  // full DDBCampaigns refresh every time _prepareContext runs.
  private _campaigns: any[] | null = null;
  private _campaignFetchInFlight = false;

  static DEFAULT_OPTIONS = {
    id: "ddb-map-browser",
    classes: ["dnd5e2", "ddb-map-browser"],
    window: {
      title: "DDB Map Browser",
      icon: "fas fa-map",
      resizable: true,
      minimizable: true,
    },
    actions: {
      reloadCatalog: DDBMapBrowser.reloadCatalog,
      selectSource: DDBMapBrowser.selectSource,
      toggleType: DDBMapBrowser.toggleType,
      toggleSource: DDBMapBrowser.toggleSource,
      importMap: DDBMapBrowser.importMap,
      importAllInSource: DDBMapBrowser.importAllInSource,
      close: DDBMapBrowser.cancel,
    },
    position: { width: 1100, height: 720 },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/map-browser/browser.hbs",
    },
  };

  _getTabs(): IDDBTabs {
    return {};
  }

  static async reloadCatalog(this: DDBMapBrowser, _event, _target) {
    DDBMapMetaData.clearCache();
    await this._loadCatalog({ force: true });
  }

  async _setTypeFilterChecked(type: string, checked: boolean) {
    const current = utils.getSetting<string[]>("munching-policy-maps-included-types") ?? [];
    const next = checked
      ? Array.from(new Set([...current, type]))
      : current.filter((t) => t !== type);
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-included-types", next);
    await this.render();
  }

  async _setExcludeDm(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-exclude-dm", checked);
    await this.render();
  }

  async _setDetectGrid(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-detect-grid", checked);
    await this.render();
  }

  async _setDoubleScale(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-double-scale", checked);
    await this.render();
  }

  async _setImportQuickplay(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-import-quickplay", checked);
    await this.render();
  }

  async _setImportQuickplayTokens(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-import-quickplay-tokens", checked);
    await this.render();
  }

  async _setUseQuickplayTokenImage(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-quickplay-token-use-ddb-image", checked);
    await this.render();
  }

  async _setImportMetaData(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-import-metadata", checked);
    await this.render();
  }

  async _setMetaDataTokens(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-maps-metadata-tokens", checked);
    await this.render();
  }

  static toggleType(this: DDBMapBrowser, _event, target) {
    const type = target?.dataset?.type;
    if (!type) return;
    if (this.expandedTypes.has(type)) this.expandedTypes.delete(type);
    else this.expandedTypes.add(type);
    this.render();
  }

  static toggleSource(this: DDBMapBrowser, _event, target) {
    const sourceId = target?.dataset?.sourceId;
    if (!sourceId) return;
    if (this.expandedSources.has(sourceId)) this.expandedSources.delete(sourceId);
    else this.expandedSources.add(sourceId);
    this.render();
  }

  static async selectSource(this: DDBMapBrowser, _event, target) {
    const sourceId = target?.dataset?.sourceId;
    const chapterId = target?.dataset?.chapterId || null;
    if (!sourceId) return;
    this.selection = { sourceId, chapterId };
    this.expandedSources.add(sourceId);
    await this.render();
    await this._loadSelectedSource();
  }

  static async importMap(this: DDBMapBrowser, _event, target) {
    const imageKey = target?.dataset?.imageKey;
    if (!imageKey) {
      logger.error("DDBMapBrowser.importMap: missing imageKey on target");
      return;
    }
    const map = this._findMapByImageKey(imageKey);
    if (!map) {
      ui.notifications.error("Could not locate the selected map in the cached source data; reload the source and try again.");
      return;
    }
    await this._importMaps([map]);
  }

  static async importAllInSource(this: DDBMapBrowser, _event, _target) {
    if (!this.selection) return;
    const key = sourceKey(this.selection);
    const payload = ensureMapsStorage().sourceMaps[key];
    let maps = payload ? DDBMaps.flattenSourceMaps(payload) : [];
    const excludeDm = utils.getSetting<boolean>("munching-policy-maps-exclude-dm");
    if (excludeDm) maps = maps.filter((m) => !isDmMap(m));
    if (!maps.length) {
      ui.notifications.warn("No maps to import for the current selection.");
      return;
    }
    await this._importMaps(maps);
  }

  _findMapByImageKey(imageKey: string): IDDBMap | null {
    const storage = ensureMapsStorage();
    for (const payload of Object.values(storage.sourceMaps)) {
      const flat = DDBMaps.flattenSourceMaps(payload);
      const hit = flat.find((m) => m.imageKey === imageKey);
      if (hit) return hit;
    }
    return null;
  }

  // Build the Type → Source → Chapter folder chain for a map. Returns the
  // names from outermost to innermost; chapter is omitted when there's no
  // matching chapter info (essentials, subscription leaves, sources without
  // chapters). DDBMap walks this list via FolderHelper.getOrCreateFolder.
  _folderPathForMap(map: IDDBMap): { path: string[]; sorts: (number | null)[] } {
    const storage = ensureMapsStorage();
    const sourceId = map.sourceId ?? map.officialData?.sourceId;
    let source: IDDBMapSource | undefined;
    let payload: IDDBSourceMaps | undefined;
    if (sourceId) {
      source = storage.catalog?.sources.find((s) => s.sourceId === sourceId);
    }
    for (const [k, p] of Object.entries(storage.sourceMaps)) {
      const flat = DDBMaps.flattenSourceMaps(p);
      if (flat.some((m) => m.imageKey === map.imageKey)) {
        payload = p;
        if (!source) {
          const sid = k.split("::")[0];
          source = storage.catalog?.sources.find((s) => s.sourceId === sid);
        }
        break;
      }
    }

    // Foundry's manual-sort default step is 100000 (CONST.SORT_INTEGER_DENSITY).
    // Using the same step keeps our values compatible with any later manual
    // drag-reordering the user does in the Scene directory.
    const STEP = 100000;
    const path: string[] = [];
    const sorts: (number | null)[] = [];
    if (source?.type) {
      path.push(TYPE_LABELS[source.type] ?? source.type);
      // TYPE_ORDER is the picker's left-column layout - apply it as the
      // folder sort so type folders land in the same sequence.
      const typeIdx = TYPE_ORDER.indexOf(source.type);
      sorts.push(typeIdx >= 0 ? (typeIdx + 1) * STEP : null);
    }
    if (source) {
      path.push((source.description ?? source.name).trim());
      // Source folders inside a type use the source's alphabetical position
      // among visible sources of that type - matches _buildGroups' sort.
      const catalogSources = storage.catalog?.sources ?? [];
      const peers = catalogSources
        .filter((s) => s.type === source!.type)
        .map((s) => (s.description ?? s.name ?? "").trim())
        .sort((a, b) => a.localeCompare(b));
      const idx = peers.indexOf((source.description ?? source.name ?? "").trim());
      sorts.push(idx >= 0 ? (idx + 1) * STEP : null);
    }
    const chapterId = map.chapterId ?? map.officialData?.chapterId;
    const chapterName = DDBMaps.chapterNameFor(payload ?? null, chapterId);
    if (chapterName) {
      path.push(chapterName);
      // Chapter sort uses each chapter's `order` field when present, else
      // falls back to its position in the API-returned list. This matters
      // because chapter names carry numeric prefixes ("Chapter 1" ...
      // "Chapter 12") plus alpha-prefixed appendices ("Appendix A", "B")
      // that string sort would shuffle into "1, 10, 11, 12, 2, 3, A, B".
      // The per-source payload's `chapters.chapters` is the authoritative
      // list; we fall back to `source.categories` from the catalog when no
      // payload has been loaded for this source.
      const payloadChapters = payload?.chapters?.chapters ?? null;
      const peers: { name: string; order?: number }[] = payloadChapters?.length
        ? payloadChapters.map((c) => ({ name: c.name, order: c.order }))
        : (source?.categories ?? []).map((c) => ({ name: c.name, order: c.order }));
      const arrayIdx = peers.findIndex((c) => c.name === chapterName);
      let sortKey: number | null = null;
      if (arrayIdx >= 0) {
        const explicitOrder = peers[arrayIdx].order;
        sortKey = typeof explicitOrder === "number" && Number.isFinite(explicitOrder)
          ? explicitOrder
          : arrayIdx;
      }
      sorts.push(sortKey !== null ? (sortKey + 1) * STEP : null);
    }
    return { path, sorts };
  }

  // Pre-flight: count how many maps in this batch already exist as scenes.
  // For batches > 1 we ask once and reuse the choice; for single-map imports
  // we let DDBMap prompt per-map (default duplicateAction "ask").
  async _resolveBatchDuplicateAction(maps: IDDBMap[]): Promise<DuplicateAction | "cancel"> {
    if (maps.length <= 1) return "ask";
    const dupes = maps.filter((m) => DDBMap.findExistingScene(m.imageKey));
    if (!dupes.length) return "ask";
    const sample = dupes.slice(0, 5).map((m) => `<li>${m.name}</li>`).join("");
    const more = dupes.length > 5 ? `<li>...and ${dupes.length - 5} more</li>` : "";
    const choice = await foundry.applications.api.DialogV2.wait({
      rejectClose: false,
      window: { title: "Some Maps Already Imported" },
      content: `<p>${dupes.length} of ${maps.length} maps in this batch were previously imported.</p>
        <ul>${sample}${more}</ul>
        <p>Apply to all duplicates:</p>`,
      buttons: [
        { action: "skip", label: "Skip Duplicates", icon: "fas fa-forward", default: true, callback: () => "skip" },
        { action: "replace", label: "Replace All", icon: "fas fa-rotate", callback: () => "replace" },
        { action: "create", label: "Import as New", icon: "fas fa-plus", callback: () => "create" },
        { action: "cancel", label: "Cancel", icon: "fas fa-times", callback: () => "cancel" },
      ],
    }) as DuplicateAction | "cancel" | null;
    return choice ?? "cancel";
  }

  async _importMaps(maps: IDDBMap[]) {
    if (!maps.length) return;
    const total = maps.length;
    const notifier = (msg: string) => logger.debug(msg);

    const batchAction = await this._resolveBatchDuplicateAction(maps);
    if (batchAction === "cancel") {
      ui.notifications.info("Import cancelled.");
      return;
    }

    // Pre-resolve folder paths once per map; the importBatch worker passes
    // each map's options through to its DDBMap instance.
    const folderPathInfos = maps.map((m) => this._folderPathForMap(m));

    // Foundry V13 progress notification: a single bar that updates in place,
    // replacing the per-map ui.notifications.info spam.
    const progressNote: any = ui.notifications.info(`Importing 0/${total} maps...`, { progress: true });
    const progressUpdate = (msg: string, pct: number) => {
      try {
        progressNote?.update?.({ message: msg, pct });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) { /* notification API unavailable, fall through */ }
    };

    const counters = { ok: 0, skipped: 0, failed: 0 };
    const optsForMap = (i: number) => ({
      notifier,
      folderPath: folderPathInfos[i].path,
      folderSorts: folderPathInfos[i].sorts,
      duplicateAction: batchAction as DuplicateAction,
    });

    // We can't pass per-index options through importBatch, so wrap each map
    // in a single-item batch via the bounded worker pool here. Concurrency 4
    // pipelines downloads + grid detection while uploads serialise through
    // DDBMap's internal upload chain.
    const CONCURRENCY = 4;
    let nextIdx = 0;
    let completed = 0;

    const worker = async () => {
      while (true) {
        const idx = nextIdx++;
        if (idx >= total) return;
        const map = maps[idx];
        try {
          const res = await DDBMap.importMap(map, optsForMap(idx));
          if (res.skipped && res.reason === "duplicate-skipped") {
            counters.skipped += 1;
          } else if (res.scene) {
            counters.ok += 1;
          } else {
            counters.failed += 1;
            logger.warn(`Map import skipped: ${map.name}`, res);
          }
        } catch (error) {
          counters.failed += 1;
          logger.error(`Map import failed for ${map.name}: ${(error as Error).message}`, error);
        }
        completed += 1;
        progressUpdate(`Imported ${completed}/${total}: ${map.name}`, completed / total);
      }
    };

    const workerCount = Math.max(1, Math.min(CONCURRENCY, total));
    progressUpdate(`Importing 0/${total} maps...`, 0);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    progressUpdate(
      `Imported ${counters.ok} scene${counters.ok === 1 ? "" : "s"}`
        + (counters.skipped ? ` (skipped ${counters.skipped})` : "")
        + (counters.failed ? ` (${counters.failed} failed)` : ""),
      1,
    );

    if (counters.failed) {
      ui.notifications.warn(`${counters.failed} map${counters.failed === 1 ? "" : "s"} failed to import; see console.`);
    }
  }

  static async cancel(this: DDBMapBrowser) {
    await this.close();
  }

  async _loadCatalog({ force = false } = {}) {
    const storage = ensureMapsStorage();
    if (!force && storage.catalog) return storage.catalog;
    if (this.loadingCatalog) return null;
    try {
      this.loadingCatalog = true;
      await this.render();
      const catalog = await DDBMaps.fetchCatalog();
      if (force) storage.sourceMaps = {};
      storage.catalog = catalog;
      storage.fetchedAt = Date.now();
      return catalog;
    } catch (error) {
      logger.error("DDBMapBrowser: catalog load failed", error);
      ui.notifications.error(`Map catalog load failed: ${error.message}`);
      return null;
    } finally {
      this.loadingCatalog = false;
      await this.render();
    }
  }

  async _loadSelectedSource() {
    if (!this.selection) return null;
    const storage = ensureMapsStorage();
    const key = sourceKey(this.selection);
    if (storage.sourceMaps[key]) {
      // Already cached - still warm meta matches in case this is a re-render
      // after the catalog was reloaded.
      this._warmMetaMatches(storage.sourceMaps[key]).catch(() => { /* logged below */ });
      return storage.sourceMaps[key];
    }
    const sel = this.selection;
    try {
      this.loadingSource = true;
      await this.render();
      const payload = await DDBMaps.fetchSourceMaps({
        sourceId: sel.sourceId,
        chapterId: sel.chapterId,
      });
      if (payload) {
        storage.sourceMaps[key] = payload;
        await this._warmMetaMatches(payload);
      }
      return payload;
    } catch (error) {
      logger.error("DDBMapBrowser: source maps fetch failed", error);
      ui.notifications.error(`Source maps fetch failed: ${error.message}`);
      return null;
    } finally {
      this.loadingSource = false;
      await this.render();
    }
  }

  // Resolve meta-data matches for every map in the just-loaded source payload
  // so the right-pane render can stamp a "Meta" tag next to matched maps.
  // Soft-fails: a meta-fetch error never blocks the source load.
  async _warmMetaMatches(payload: IDDBSourceMaps) {
    if (!utils.getSetting<boolean>("munching-policy-maps-import-metadata")) return;
    try {
      const flat = DDBMaps.flattenSourceMaps(payload);
      await DDBMapMetaData.findMatchesForMaps(flat);
    } catch (error) {
      logger.warn(`DDBMapBrowser: meta-data match warm-up failed: ${(error as Error).message ?? error}`);
    }
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    if (!ensureMapsStorage().catalog) {
      this._loadCatalog();
    }
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    // Campaign dropdown (when the list fetched successfully) / free-text
    // input (when it didn't). Change events on either path write to the
    // ddb-maps-campaign-id setting.
    this.element.querySelectorAll<HTMLSelectElement>(".ddb-map-browser-campaign-select").forEach((sel) => {
      sel.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLSelectElement;
        this._setMapsCampaignId(el.value);
      });
    });
    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-campaign-input").forEach((inp) => {
      inp.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setMapsCampaignId(el.value);
      });
    });

    const input = this.element.querySelector("#map-browser-search") as HTMLInputElement | null;
    if (!input) return;

    if (this._searchCaret) {
      input.focus();
      const { start, end } = this._searchCaret;
      try {
        input.setSelectionRange(start, end);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) { /* ignore unsupported */ }
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

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-type-filter").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        const type = el.dataset.mapType;
        if (!type) return;
        this._setTypeFilterChecked(type, el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-exclude-dm-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setExcludeDm(el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-detect-grid-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setDetectGrid(el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-double-scale-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setDoubleScale(el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-quickplay-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setImportQuickplay(el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-quickplay-tokens-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setImportQuickplayTokens(el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-quickplay-token-image-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setUseQuickplayTokenImage(el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-metadata-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setImportMetaData(el.checked);
      });
    });

    this.element.querySelectorAll<HTMLInputElement>(".ddb-map-browser-metadata-tokens-toggle").forEach((cb) => {
      cb.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLInputElement;
        this._setMetaDataTokens(el.checked);
      });
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext({ ...options, noCacheLoad: true }) as any;

    const storage = ensureMapsStorage();
    const catalog: IDDBMapCatalog | null = storage.catalog;
    const includedTypes = utils.getSetting<string[]>("munching-policy-maps-included-types");
    const includedSet = new Set(includedTypes);
    const search = this.searchTerm.trim().toLowerCase();

    context.loadingCatalog = this.loadingCatalog;
    context.loadingSource = this.loadingSource;
    context.searchTerm = this.searchTerm;
    context.fetchedAt = storage.fetchedAt
      ? new Date(storage.fetchedAt).toLocaleTimeString()
      : null;

    context.typeFilters = TYPE_ORDER.map((type) => ({
      type,
      label: TYPE_LABELS[type] ?? type,
      checked: includedSet.has(type),
    }));

    context.excludeDm = utils.getSetting<boolean>("munching-policy-maps-exclude-dm");
    context.detectGrid = utils.getSetting<boolean>("munching-policy-maps-detect-grid");
    context.doubleScale = utils.getSetting<boolean>("munching-policy-maps-double-scale");
    context.importQuickplay = utils.getSetting<boolean>("munching-policy-maps-import-quickplay");
    context.importQuickplayTokens = utils.getSetting<boolean>("munching-policy-maps-import-quickplay-tokens");
    context.useQuickplayTokenImage = utils.getSetting<boolean>("munching-policy-maps-quickplay-token-use-ddb-image");
    context.importMetaData = utils.getSetting<boolean>("munching-policy-maps-import-metadata");
    context.metaDataTokens = utils.getSetting<boolean>("munching-policy-maps-metadata-tokens");
    context.groups = this._buildGroups(catalog, includedSet, search);
    context.detail = await this._buildDetail(storage, context.excludeDm);
    context.hasCatalog = !!catalog;
    context.totalSources = catalog?.sources.length ?? 0;
    context.filteredSources = context.groups.reduce((acc, g) => acc + g.sources.length, 0);

    // Campaign picker: read the maps-specific setting, lazily fetch the
    // available-campaigns list once per session. Empty list -> the template
    // falls back to a free-text id input. Load Catalog is disabled until
    // the user picks (or types) a campaign id.
    const selectedCampaignId = (utils.getSetting<string>("ddb-maps-campaign-id") ?? "").toString().trim();
    if (this._campaigns === null && !this._campaignFetchInFlight) {
      this._campaignFetchInFlight = true;
      // Don't await - render with empty list, populate on next render. The
      // fetch updates this._campaigns and triggers a re-render.
      this._loadCampaigns(selectedCampaignId).then(() => {
        this._campaignFetchInFlight = false;
        this.render();
      }).catch((_e) => {
        this._campaignFetchInFlight = false;
        this._campaigns = [];
        this.render();
      });
    }
    context.selectedCampaignId = selectedCampaignId;
    context.campaigns = (this._campaigns ?? []).map((c) => ({
      ...c,
      selected: String(c.id) === selectedCampaignId,
    }));
    context.canLoadCatalog = selectedCampaignId !== "" && !this.loadingCatalog;
    return context;
  }

  async _loadCampaigns(selectedId: string) {
    try {
      const cobalt = Secrets.getCobalt();
      const list = await DDBCampaigns.getDDBCampaigns(cobalt);
      this._campaigns = Array.isArray(list) ? list : [];
    } catch (error) {
      logger.warn(`DDBMapBrowser: campaign fetch failed: ${(error as Error).message}`);
      this._campaigns = [];
    }
    // Suppress the unused-arg warning - selectedId is used by the consumer
    // (selected flag) after this fetch resolves.
    void selectedId;
  }

  async _setMapsCampaignId(value: string) {
    const cleaned = (value ?? "").toString().trim();
    await game.settings.set(SETTINGS.MODULE_ID, "ddb-maps-campaign-id", cleaned);
    await this.render();
  }

  _buildGroups(catalog: IDDBMapCatalog | null, includedSet: Set<string>, search: string) {
    if (!catalog) return [];
    const matchesSearch = (src: IDDBMapSource) => {
      if (!search) return true;
      return (src.name ?? "").toLowerCase().includes(search)
        || (src.description ?? "").toLowerCase().includes(search)
        || (src.categories ?? []).some((c) => c.name.toLowerCase().includes(search));
    };

    // Pre-compute which sources have Quickplay content. Prefer the
    // catalog-level flag DDB returns via the proxy; fall back to scanning
    // any per-source payloads we've already loaded for sources where the
    // catalog didn't carry the flag.
    const storage = ensureMapsStorage();
    const hasQuickplayBySource = new Map<string, boolean>();
    for (const src of catalog.sources) {
      if (src.hasQuickplay) hasQuickplayBySource.set(src.sourceId, true);
    }
    for (const [key, payload] of Object.entries(storage.sourceMaps)) {
      const sourceId = key.split("::")[0];
      if (hasQuickplayBySource.get(sourceId)) continue;
      const flat = DDBMaps.flattenSourceMaps(payload);
      if (flat.some((m) => !!m.preparedMap?.mapStateKey)) {
        hasQuickplayBySource.set(sourceId, true);
      }
    }

    const byType: Record<string, IDDBMapSource[]> = {};
    for (const src of catalog.sources) {
      if (!includedSet.has(src.type)) continue;
      if (!matchesSearch(src)) continue;
      (byType[src.type] ??= []).push(src);
    }

    return TYPE_ORDER
      .filter((t) => byType[t]?.length)
      .map((type) => ({
        type,
        label: TYPE_LABELS[type] ?? type,
        expanded: this.expandedTypes.has(type) || !!search,
        count: byType[type].length,
        sources: byType[type]
          .map((src) => {
            const isSelected = this.selection?.sourceId === src.sourceId;
            const isExpanded = this.expandedSources.has(src.sourceId) || !!search;
            return {
              sourceId: src.sourceId,
              name: src.name,
              description: src.description ?? src.name,
              type: src.type,
              released: src.released ?? true,
              backgroundImage: src.backgroundImage ?? null,
              expanded: isExpanded,
              selected: isSelected && !this.selection?.chapterId,
              hasQuickplay: !!hasQuickplayBySource.get(src.sourceId),
              hasCategories: !!(src.categories && src.categories.length),
              categories: (src.categories ?? [])
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  selected: this.selection?.sourceId === src.sourceId && this.selection?.chapterId === c.id,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            };
          })
          .sort((a, b) => (a.description ?? a.name).localeCompare(b.description ?? b.name)),
      }));
  }

  async _buildDetail(storage: NonNullable<typeof CONFIG.DDBI.MAPS>, excludeDm: boolean) {
    const empty = { state: "empty", isEmpty: true, isLoading: false, isMissing: false, isReady: false };
    if (!this.selection) return empty;
    const catalog = storage.catalog;
    const sel = this.selection;
    const source = catalog?.sources.find((s) => s.sourceId === sel.sourceId);
    if (!source) return empty;
    const category = sel.chapterId
      ? source.categories?.find((c) => c.id === sel.chapterId)
      : null;
    const key = sourceKey(sel);
    const payload: IDDBSourceMaps | undefined = storage.sourceMaps[key];

    if (!payload) {
      const loading = this.loadingSource;
      return {
        state: loading ? "loading" : "missing",
        isEmpty: false,
        isLoading: loading,
        isMissing: !loading,
        isReady: false,
        sourceTitle: source.description ?? source.name,
        sourceCover: source.backgroundImage ?? null,
        chapterTitle: category?.name ?? null,
      };
    }

    const grouped = DDBMaps.groupSourceMaps(payload);
    const totalMaps = grouped.reduce((sum, g) => sum + g.maps.length, 0);
    const filteredGroups = grouped.map((g) => ({
      chapterId: g.chapterId,
      maps: excludeDm ? g.maps.filter((m) => !isDmMap(m)) : g.maps,
    }));
    const visibleCount = filteredGroups.reduce((sum, g) => sum + g.maps.length, 0);
    const hiddenCount = totalMaps - visibleCount;

    const chapters = payload.chapters?.chapters ?? [];
    const chapterById = new Map<string, { id: string; name: string; order?: number }>();
    chapters.forEach((c, idx) => chapterById.set(c.id, { ...c, order: c.order ?? idx + 1 }));

    const mapToView = (map: IDDBMap) => {
      const metaMatch = DDBMapMetaData.getCachedMatch(map);
      return {
        id: map.id,
        name: map.name,
        description: map.description ?? "",
        imageKey: map.imageKey,
        thumbnailKey: map.thumbnailKey,
        thumbnail: typeof map.thumbnail === "string" ? map.thumbnail : null,
        order: map.order ?? 0,
        hasPreparedMap: !!map.preparedMap?.mapStateKey,
        preparedMapDescription: map.preparedMap?.description ?? null,
        dimensions: map.imageDimensions
          ? `${map.imageDimensions.x} x ${map.imageDimensions.y}`
          : null,
        hasMetaMatch: !!metaMatch,
        metaMatchedBy: metaMatch?.matchedBy ?? null,
      };
    };

    // Only render chapter sections when a chapter id resolves to a known
    // chapter name. Anything else falls into a single ungrouped bucket with
    // no header so we never display raw ids like "official" to the user.
    interface Bucket { id: string; name: string; order: number; showHeader: boolean; maps: any[] }
    const buckets = new Map<string, Bucket>();
    const ungroupedKey = "_ungrouped";
    for (const grp of filteredGroups) {
      if (!grp.maps.length) continue;
      const chap = grp.chapterId ? chapterById.get(grp.chapterId) : null;
      const bucketKey = chap ? chap.id : ungroupedKey;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, chap
          ? { id: chap.id, name: chap.name, order: chap.order ?? 9999, showHeader: true, maps: [] }
          : { id: ungroupedKey, name: "", order: 99999, showHeader: false, maps: [] });
      }
      const bucket = buckets.get(bucketKey)!;
      for (const m of grp.maps) bucket.maps.push(mapToView(m));
    }

    const visibleBuckets = [...buckets.values()].filter((b) => b.maps.length > 0);
    // If only one bucket survived and it has no real chapter name, drop the
    // header so essentials/subscription-leaf views render as a flat list.
    if (visibleBuckets.length === 1 && !visibleBuckets[0].showHeader) {
      visibleBuckets[0].showHeader = false;
    }

    const chapterGroups = visibleBuckets
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map((g) => ({
        ...g,
        mapCount: g.maps.length,
        mapCountLabel: g.maps.length === 1 ? "1 map" : `${g.maps.length} maps`,
        maps: g.maps.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
      }));

    return {
      state: "ready",
      isEmpty: false,
      isLoading: false,
      isMissing: false,
      isReady: true,
      sourceTitle: source.description ?? source.name,
      sourceCover: source.backgroundImage ?? null,
      chapterTitle: category?.name ?? null,
      mapCount: visibleCount,
      hiddenCount,
      chapterGroups,
      anyPreparedMap: chapterGroups.some((g) => g.maps.some((m: any) => m.hasPreparedMap)),
    };
  }

}
