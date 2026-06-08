import { logger, utils, DDBSources } from "../../../lib/_module";
import { decryptAndQuery } from "../../../lib/SqliteCipher";
import { generateAdventureConfig } from "../../adventure";
import NativeIdFactory from "./NativeIdFactory";
import { processRow, type ContentRow } from "./ContentRowProcessor";
import { buildMasterJournalFolder } from "./NativeFolderBuilder";
import { buildJournals } from "./NativeJournalBuilder";
import { buildTables } from "./NativeTableBuilder";
import { fetchTableHints, type TableHint } from "./NativeTableHints";
import { resolveInternalLinks } from "./NativeJournalLinker";
import { importToCompendiums } from "./NativeCompendiumImporter";
import { importRequiredMonsters, importAllMonstersToWorld, buildMonsterSwapMap, type MonsterSwap } from "./NativeMonsterImporter";
import AdventureMunchHelpers from "../AdventureMunchHelpers";
import { importSpellsAndItems } from "./NativeSpellItemImporter";
import { importAssets } from "./NativeAssetHandler";
import { buildBookThemeCss } from "./NativeBookStyles";
import { fetchEnhancements } from "./NativeEnhancements";
import { buildScenes } from "./NativeSceneBuilder";
import { applyScenes } from "./NativeSceneApplier";
import BookData, { type NativeBookZip } from "./BookData";
import { DDBReferenceLinker } from "../../../parser/lib/_module";

const CONTENT_QUERY
  = "SELECT ID as id, CobaltID as cobaltId, ParentID as parentId, Slug as slug, Title as title, RenderedHTML as html FROM Content";

export interface ImportOptions {
  /** import only into the compendiums, skip the world (implies addToCompendiums) */
  compendiumOnly?: boolean;
  /** also copy into the DDB compendiums (defaults to the adventure-policy setting) */
  addToCompendiums?: boolean;
  /** import every referenced monster into the world, not just scene tokens
   *  (defaults to the `adventure-policy-all-actors-into-world` setting) */
  importAllMonsters?: boolean;
  /** import all detected scenes without prompting
   *  (defaults to the `adventure-policy-all-scenes` setting) */
  allScenes?: boolean;
  /** explicit subset of scene `_id`s to import; bypasses the chooser dialog */
  sceneIds?: string[];
  /** set JournalEntry + RollTable ownership.default to OBSERVER (all players can read)
   *  (defaults to the `adventure-policy-observe-all` setting) */
  observeAll?: boolean;
  /** replace legacy (2014) monsters with their 2024 versions where available
   *  (defaults to the `adventure-policy-use2024-monsters` setting) */
  use2024monsters?: boolean;
}

/** Progress sink - the bound `DDBAppV2.notifierV2`. */
type Notify = (props: NotifierV2Props) => void;
/** Per-item callback handed to loop-bearing submodules (secondary bar). */
export type ItemNotify = (current: number, total: number, label?: string) => void;

/**
 * In-browser adventure importer - Phase 1 vertical slice (journals only).
 *
 * Decrypts a book's `.db3`, turns the `Content` table into Foundry JournalEntry +
 * Folder documents, and creates them directly (no `.fvttadv` zip, no AdventureMunch).
 * Re-import is idempotent thanks to deterministic ids (NativeIdFactory).
 *
 * Two entry points:
 *  - `importFromBytes` - feed decrypted-source bytes + key directly (no network);
 *  - `importBook` - full network path via BookData (needs the new proxy routes).
 */
export default class NativeAdventureMunch {

  #notifier: Notify | null = null;
  #phaseIdx = 0;
  #phaseTotal = 0;

  constructor({ notifier = null }: { notifier?: Notify | null } = {}) {
    this.#notifier = notifier ?? null;
  }

  // Resolve the effective flags (option override, else adventure-policy setting).
  // Shared by the phase-count and the import logic so the bar denominator matches
  // what actually runs.
  #effectiveFlags(options: ImportOptions) {
    const compendiumOnly = options.compendiumOnly ?? utils.getSetting<boolean>("adventure-policy-compendium-only");
    const addToCompendiums = compendiumOnly
      || (options.addToCompendiums ?? utils.getSetting<boolean>("adventure-policy-add-to-compendiums"));
    const importAllMonsters = options.importAllMonsters
      ?? utils.getSetting<boolean>("adventure-policy-all-actors-into-world");
    const allScenes = options.allScenes ?? utils.getSetting<boolean>("adventure-policy-all-scenes");
    const observeAll = options.observeAll ?? utils.getSetting<boolean>("adventure-policy-observe-all");
    const use2024monsters = options.use2024monsters ?? utils.getSetting<boolean>("adventure-policy-use2024-monsters");
    return { compendiumOnly, addToCompendiums, importAllMonsters, allScenes, observeAll, use2024monsters };
  }

  // Count of #process phases that will actually run, for the primary bar.
  #countProcessPhases(options: ImportOptions, hasZip: boolean): number {
    const { compendiumOnly, addToCompendiums, importAllMonsters } = this.#effectiveFlags(options);
    let n = 5; // spells/items, monsters, journals&tables, scenes-build, resolve-links
    if (hasZip) n += 1; // assets
    if (!compendiumOnly) n += 2; // create documents + apply scenes
    if (!compendiumOnly && importAllMonsters) n += 1; // world monsters
    if (addToCompendiums) n += 1; // copy to compendiums
    return n;
  }

  // Advance the primary (phase) bar and set the phase label.
  #phase(label: string): void {
    this.#phaseIdx += 1;
    this.#notifier?.({
      section: "monster",
      message: label,
      progress: { current: this.#phaseIdx, total: this.#phaseTotal },
      progressBar: "primary",
    });
  }

  // Per-item callback for the secondary bar; pass to loop-bearing submodules.
  #item: ItemNotify = (current, total, label = "") => {
    this.#notifier?.({
      section: "import",
      message: label,
      progress: { current, total },
      progressBar: "secondary",
    });
  };

  #clearSecondary(): void {
    this.#notifier?.({ section: "import", message: "", clear: true, progressBar: "secondary" });
  }

  /** Import directly from a `.db3` byte array + key (no network, no images). */
  async importFromBytes(db3Bytes: Uint8Array, key: string, bookCode: string, bookName?: string, options: ImportOptions = {}): Promise<any> {
    // Folder name = the adventure's full name (matches the muncher, which uses
    // the book description). Resolve from the DDB config sources by bookCode;
    // fall back to bookName arg, then the code itself.
    const resolvedName = bookName ?? (DDBSources.getBookName(bookCode) || bookCode);
    this.#phaseIdx = 0;
    this.#phaseTotal = 1 + this.#countProcessPhases(options, false); // decrypt + process phases
    this.#phase("Decrypting content");
    const rows = (await decryptAndQuery(db3Bytes, key, CONTENT_QUERY)) as ContentRow[];
    logger.info(`NativeAdventureMunch: decrypted ${rows.length} Content rows for ${bookCode} ("${resolvedName}")`);
    return this.#process(rows, bookCode, resolvedName, undefined, [], new Map(), options);
  }

  /** Full automatic import: fetch key + zip via proxy, decrypt, build journals + images. */
  async importBook(bookId: number | string, options: ImportOptions = {}): Promise<any> {
    this.#phaseIdx = 0;
    this.#phaseTotal = 2 + this.#countProcessPhases(options, true); // acquire + decrypt + process phases
    this.#phase("Acquiring book");
    const { bookCode, key, db3Bytes, zip } = await BookData.acquire(bookId);
    const resolvedName = DDBSources.getBookName(bookCode) || bookCode;
    try {
      this.#phase("Decrypting content");
      const rows = (await decryptAndQuery(db3Bytes, key, CONTENT_QUERY)) as ContentRow[];
      logger.info(`NativeAdventureMunch: decrypted ${rows.length} Content rows for ${bookCode} ("${resolvedName}")`);
      const enhancements = await fetchEnhancements(bookId);
      const tableHints = await fetchTableHints(bookCode);
      return await this.#process(rows, bookCode, resolvedName, zip, enhancements, tableHints, options);
    } finally {
      await zip.close();
    }
  }

  async #process(rows: ContentRow[], bookCode: string, bookName: string, zip?: NativeBookZip, enhancements: any[] = [], tableHints: Map<string, TableHint> = new Map<string, TableHint>(), options: ImportOptions = {}): Promise<any> {
    // full=true builds compendium lookups (monsters/spells/items); cobalt=false
    // skips the vehicle fetch so the file-test path works without auth (vehicle
    // links just fall back to DDB urls - fine for the journals slice).
    // compendium-only implies adding to compendiums; both fall back to their settings
    const { compendiumOnly, addToCompendiums, importAllMonsters, allScenes, observeAll, use2024monsters } = this.#effectiveFlags(options);

    // 2014→2024 monster swap: prompt once (chooser dialog) for which referenced
    // monsters to upgrade, then thread the map to compendium import, journal-link
    // replacement and scene tokens. Empty map when the option is off / lookup fails.
    const monsterSwap: Map<number, MonsterSwap> = use2024monsters
      ? await buildMonsterSwapMap(rows, bookName)
      : new Map();

    // import referenced + core-rulebook spells/items into the compendiums first,
    // then any referenced monsters, so the freshly-built lookups below resolve
    // ddb://spells, ddb://magicitems|weapons|armor|adventuring-gear, ddb://monsters
    this.#phase("Importing spells & items");
    this.#clearSecondary();
    await importSpellsAndItems(rows, bookCode);
    this.#phase("Importing monsters");
    await importRequiredMonsters(rows, monsterSwap);

    const adventureConfig = await generateAdventureConfig({ full: true, cobalt: false });
    // expose the swap to NativeLinkReplacer.foundryCompendiumReplace (consumed via
    // adventureConfig, which already reaches processRow); shared replacer shape.
    adventureConfig.monstersToReplace = [...monsterSwap.values()];
    const idFactory = new NativeIdFactory();

    await DDBReferenceLinker.importCacheLoad();

    // Images: download + upload to the muncher-matching path (network path only).
    let imageOpts: { bookCode: string; assetMap: Map<string, string> } | undefined;
    let themeCss: string | null = null;
    if (zip) {
      this.#phase("Downloading assets");
      imageOpts = { bookCode, assetMap: await importAssets({ zip, adventureName: bookName, enhancements, notify: this.#item }) };
      // extract the book's native :root theme vars → scoped css stored on the
      // journal flags, injected as a <style> when a journal opens (renderJournalSheet).
      themeCss = await buildBookThemeCss({ zip, bookCode, assetMap: imageOpts.assetMap });
    }

    const processed = rows.map((row) => processRow(row, adventureConfig, imageOpts));

    // RollTables: parse <table> elements → world tables in nested per-chapter
    // folders (created lazily via FolderHelper  no empty folders), and append
    // "Open RollTable" links into the journal content.
    this.#phase("Building journals & tables");
    this.#clearSecondary();
    const { tables, folders: tableFolders, updatedContentById } = await buildTables(processed, bookName, bookCode, idFactory, tableHints, this.#item);
    for (const row of processed) {
      const updated = updatedContentById.get(row.id);
      if (updated !== undefined) row.content = updated;
    }

    const journalFolder = buildMasterJournalFolder(idFactory, bookCode, bookName);
    const journals = buildJournals(processed, journalFolder._id, bookCode, idFactory, this.#item, themeCss);

    // Scenes: HTML-scan rows for map markers, build base Scene docs (background
    // resolved from the assetMap). Walls/lights/notes/tokens are applied AFTER
    // world create via NativeSceneApplier (DDBMapMetaData.enrich path).
    this.#phase("Building scenes");
    this.#clearSecondary();
    const { scenes: builtScenes, folders: sceneFolders } = await buildScenes(
      processed, bookCode, bookName, imageOpts?.assetMap ?? new Map(), idFactory, this.#item,
    );

    // resolve internal cross-page references now that all journal/page ids exist
    this.#phase("Resolving links");
    this.#clearSecondary();
    resolveInternalLinks(journals, tables, bookCode);

    // observeAll: set journal + table default ownership to OBSERVER so all
    // players can read them (matches the original muncher's `observeAll`).
    // Done before create/compendium phases so world docs AND compendium copies
    // (both consume these arrays) get observer ownership.
    if (observeAll) {
      const OBSERVER = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER; // 2
      for (const j of journals) j.ownership = { ...(j.ownership ?? {}), default: OBSERVER };
      for (const t of tables) t.ownership = { ...(t.ownership ?? {}), default: OBSERVER };
    }

    // Scene selection: explicit sceneIds wins; otherwise (when not "all scenes")
    // prompt the shared chooser dialog. null/empty selection => import everything.
    let selectedIds: string[] | null = options.sceneIds ?? null;
    if (selectedIds === null && !compendiumOnly && !allScenes && builtScenes.length) {
      selectedIds = await AdventureMunchHelpers.chooseScenesDialog(
        builtScenes.map((s) => ({ _id: s.doc._id, name: s.doc.name })),
      );
    }
    const scenesToImport = selectedIds
      ? builtScenes.filter((s) => selectedIds!.includes(s.doc._id))
      : builtScenes;

    // Keep only the scene folders that still contain a selected scene (walk each
    // doc's folder chain to its parents). Avoids creating empty chapter folders.
    const folderById = new Map<string, I5eFolderData>(sceneFolders.map((f) => [f._id, f]));
    const keepFolderIds = new Set<string>();
    for (const s of scenesToImport) {
      let fid: string | null = s.doc.folder ?? null;
      while (fid && !keepFolderIds.has(fid)) {
        keepFolderIds.add(fid);
        fid = folderById.get(fid)?.folder ?? null;
      }
    }
    const sceneFoldersToImport = scenesToImport.length === builtScenes.length
      ? sceneFolders
      : sceneFolders.filter((f) => keepFolderIds.has(f._id));

    const allFolders = [journalFolder, ...tableFolders, ...sceneFoldersToImport];

    logger.info(`NativeAdventureMunch: ${journals.length} journals, ${tables.length} tables, ${scenesToImport.length}/${builtScenes.length} scenes for "${bookName}" (compendiumOnly=${compendiumOnly}, addToCompendiums=${addToCompendiums}, importAllMonsters=${importAllMonsters})`);

    const sceneDocs = scenesToImport.map((s) => s.doc);

    if (!compendiumOnly) {
      // "Creating documents" phase: report each document group on the secondary
      // bar (createDocuments is atomic, so granularity is per-group, not per-doc).
      this.#phase("Creating documents");
      this.#clearSecondary();
      const groups: [any, any, any[], string][] = [
        [Folder, game.folders, allFolders, "folders"],
        [JournalEntry, game.journal, journals, "journals"],
        [RollTable, game.tables, tables, "tables"],
        [Scene, game.scenes, sceneDocs, "scenes"],
      ].filter(([, , docs]) => (docs as any[]).length) as any;
      for (let i = 0; i < groups.length; i++) {
        const [cls, collection, docs, label] = groups[i];
        this.#item(i, groups.length, `Creating ${docs.length} ${label}`);
        await NativeAdventureMunch.#createOrUpdate(cls, collection, docs);
      }
      this.#item(groups.length, groups.length, "Documents created");
      // post-create: enrich each world scene via DDBMapMetaData (walls/lights/
      // drawings/notes/tokens) and re-point note pins at our journal pages.
      this.#phase("Applying scenes");
      this.#clearSecondary();
      if (scenesToImport.length) await applyScenes(scenesToImport, journals, bookCode, { applyTokens: true, notify: this.#item, monsterSwap });
      // optional: import every referenced monster into the world (superset of the
      // scene-token actors imported by applyScenes). Dedup happens in the helper.
      if (importAllMonsters) {
        this.#phase("Importing all monsters to world");
        this.#clearSecondary();
        await importAllMonstersToWorld(rows, bookName);
      }
    }

    // copy journals + tables into the DDB compendiums, repointing the copies'
    // internal links to the compendium versions of imported docs only.
    if (addToCompendiums) {
      this.#phase("Copying to compendiums");
      this.#clearSecondary();
      await importToCompendiums(journals, tables, allFolders);
    }

    ui.notifications?.info(`DDB native import: ${journals.length} journals, ${tables.length} tables, ${scenesToImport.length} scenes for ${bookName}`);
    return { folder: journalFolder, journals, tables, scenes: sceneDocs };
  }

  /**
   * POC harness: prompt for a `.db3` + key + bookCode, then import journals.
   * Lets us validate rows→journals before the proxy routes exist.
   * Call: DDBImporter.debug.nativeAdventureImportFile()
   */
  static async promptImportFromFile(): Promise<any> {
    const content = `
      <form>
        <div class="form-group"><label>Book .db3</label>
          <input type="file" name="db3" accept=".db3,.db,.sqlite,.sqlite3" autofocus /></div>
        <div class="form-group"><label>SQLCipher key</label>
          <input type="text" name="key" /></div>
        <div class="form-group"><label>Book code</label>
          <input type="text" name="bookCode" placeholder="e.g. lmop" /></div>
        <div class="form-group"><label>Compendium only</label>
          <input type="checkbox" name="compendiumOnly" /></div>
        <div class="form-group"><label>Import all monsters into world</label>
          <input type="checkbox" name="importAllMonsters" /></div>
        <div class="form-group"><label>Choose scenes (prompt)</label>
          <input type="checkbox" name="chooseScenes" /></div>
      </form>`;

    const result = await foundry.applications.api.DialogV2.wait({
      rejectClose: false,
      window: { title: "DDB Native Adventure Import (journals)" },
      position: { width: 480 },
      content,
      buttons: [
        {
          action: "import",
          label: "Import Journals",
          icon: "fas fa-book",
          default: true,
          callback: async (_event: any, button: any) => {
            const form: HTMLFormElement = button.form;
            const file = (form.querySelector("input[name='db3']") as HTMLInputElement)?.files?.[0];
            const key = (form.querySelector("input[name='key']") as HTMLInputElement)?.value;
            const bookCode = (form.querySelector("input[name='bookCode']") as HTMLInputElement)?.value;
            const compendiumOnly = (form.querySelector("input[name='compendiumOnly']") as HTMLInputElement)?.checked;
            const importAllMonsters = (form.querySelector("input[name='importAllMonsters']") as HTMLInputElement)?.checked;
            const chooseScenes = (form.querySelector("input[name='chooseScenes']") as HTMLInputElement)?.checked;
            if (!file || !key || !bookCode) return null;
            return { bytes: new Uint8Array(await file.arrayBuffer()), key, bookCode, compendiumOnly, importAllMonsters, chooseScenes };
          },
        },
        { action: "cancel", label: "Cancel", icon: "fas fa-times", callback: () => null },
      ],
    }) as { bytes: Uint8Array; key: string; bookCode: string; compendiumOnly: boolean; importAllMonsters: boolean; chooseScenes: boolean } | null;

    if (!result) return undefined;
    // chooseScenes ticked => allScenes:false forces the chooser dialog regardless of setting.
    return new NativeAdventureMunch().importFromBytes(result.bytes, result.key, result.bookCode, undefined, {
      compendiumOnly: result.compendiumOnly,
      importAllMonsters: result.importAllMonsters,
      allScenes: result.chooseScenes ? false : undefined,
    });
  }

  // Create new docs (keepId) or update existing ones matched by deterministic _id.
  static async #createOrUpdate(cls: any, collection: any, docs: any[]): Promise<void> {
    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    for (const doc of docs) {
      if (collection?.get(doc._id)) toUpdate.push(doc);
      else toCreate.push(doc);
    }
    if (toCreate.length) await cls.createDocuments(toCreate, { keepId: true, keepEmbeddedIds: true });
    if (toUpdate.length) await cls.updateDocuments(toUpdate, { keepEmbeddedIds: true });
  }
}
