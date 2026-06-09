export {};

global {

  /* ---- NativeAdventureMunch ---- */

  /** Options for the native (in-browser) adventure importer. Each falls back to
   *  its `adventure-policy-*` setting when omitted. */
  interface ImportOptions {
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

  /** Per-item callback handed to loop-bearing submodules (secondary bar). */
  type ItemNotify = (current: number, total: number, label?: string) => void;

  /* ---- ContentRowProcessor ---- */

  /** Image handling: rewrite image links to uploaded stored paths. */
  interface ImageOpts {
    bookCode: string;
    assetMap: Map<string, string>;
  }

  /** A raw row from the `Content` table. */
  interface ContentRow {
    id: number;
    cobaltId: number | null;
    parentId: number | null;
    slug: string | null;
    title: string | null;
    html: string | null;
  }

  /** A processed row ready for journal/folder building. */
  interface ProcessedRow {
    id: number;
    cobaltId: number | null;
    parentId: number | null;
    slug: string | null;
    title: string;
    contentChunkId: string | null;
    /** page content HTML, links replaced, leading title heading stripped */
    content: string;
    /** linked HTML BEFORE the heading strip - used for table parsing/naming */
    sourceHtml: string;
    level: number;
  }

  /* ---- NativeMonsterImporter ---- */

  /** A selected 2014→2024 monster swap (subset of MonsterReplacer's hint payload). */
  interface MonsterSwap {
    id2014: number;
    id2024: number;
    name2024: string;
  }

  /* ---- NativeSessionCache ---- */

  type NativeSessionCache = NonNullable<import("../../../hooks/ready/registerGameSettings").IDDBIConfig["NATIVE"]>;

  /* ---- NativeSceneParser ---- */

  interface DetectedScene {
    /** Display name including "(Player Version)" / "(Unlabeled Version)" suffix. */
    name: string;
    /** Asset-relative image path (`assets/<book>/<...>`). */
    imagePath: string;
    /** From the source `<a>`/`<figure>` `data-content-chunk-id` (or synthesised when absent). */
    contentChunkId: string;
    /** True when the source link advertised this as a player-facing map. */
    isPlayer: boolean;
    /** Which detector produced this entry - useful for logging. `"missing"` =
     *  synthesised from a `missing: true` enhancement, not from HTML scanning. */
    source: "figure" | "div" | "viewplayer" | "linkfallback" | "missing";
    /** Synthetic numeric id so multiple scenes per row don't collide on `_id` derivation. */
    syntheticIdOffset: number;
  }

  /* ---- NativeNoteResolution ---- */

  interface PageRef { entryId: string; pageId: string }

  /** A resolved note target: the page plus the in-page anchor to scroll to (if any). */
  interface NoteTarget extends PageRef { anchor: string | null }

  interface JournalPageLookup {
    /** contentChunkId -> page (from `[data-content-chunk-id]` in page HTML). */
    pageByChunk: Map<string, PageRef>;
    /** contentChunkId -> injected heading id (the in-page anchor for that chunk). */
    anchorByChunk: Map<string, string>;
    /** element id / anchor -> page (from `[id]` in page HTML). */
    pageByElementId: Map<string, PageRef>;
    /** normalised slug -> page (sections resolve to their chapter journal page). */
    pageBySlug: Map<string, PageRef>;
  }

  /* ---- NativeImageProbe ---- */

  interface ImageSize { width: number; height: number }
  interface ImageProbeResult { width: number; height: number; edgeColor: string | null }

  /* ---- BookData ---- */

  interface AcquiredBook {
    bookCode: string;
    bookName: string;
    key: string;
    db3Bytes: Uint8Array;
    zip: import("./BookData").NativeBookZip;
  }

  /* ---- NativeSceneBuilder ---- */

  interface BuiltScene {
    doc: any;
    /** Original detection + source row so the applier can rebuild the mapStub for enrich(). */
    detection: DetectedScene;
    row: ProcessedRow;
  }

  interface BuiltScenes {
    scenes: BuiltScene[];
    folders: I5eFolderData[];
  }

  /* ---- NativeTableHints ---- */

  /** Table name/folder hints from ddb-meta-data's `table_info/<bookCode>.json`. */
  interface TableHint {
    tableName?: string;
    folderName?: string;
  }

}
