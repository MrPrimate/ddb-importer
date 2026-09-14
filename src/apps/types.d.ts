export {};

global {

  interface IDDBTab extends foundry.applications.api.Application.Tab {
    tabs?: DeepPartial<IDDBTabs>;
  }

  type IDDBTabs = Record<string, DeepPartial<IDDBTab>>;

  interface NotifierV1Props {
    nameField?: boolean;
    monsterNote?: boolean;
    isError?: boolean;
    // some callers pass a boolean flag here; munchNote treats it as truthy only
    message?: string | boolean;
  }

  type NotifierV1 = ((note: any, { nameField, monsterNote, isError, message }?: NotifierV1Props) => void);

  interface NotifierV2Props {
    progress?: {
      current: number;
      total: number;
    };
    section?: string;
    message: string;
    suppress?: boolean;
    isError?: boolean;
    clear?: boolean;
    progressBar?: "primary" | "secondary" | "overall";
  }

  type INotifierV2 = ((props: NotifierV2Props) => void);

  interface DDBApplicationPart extends foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart {
    container?: {
      id: string;
      classes?: string[];
    };
  }

  interface DDBAppV2Context extends foundry.applications.api.Application.RenderContext {
    tabs?: IDDBTabs;
    tab?: Partial<IDDBTab>;
  }

  /** One listed download in the Sources and Cache window's Cache Management tab. */
  interface ISourceBookBrowserCacheRow {
    /** Full cache key for a single entry; absent on aggregate rows, which are cleared via their group. */
    key?: string;
    label: string;
    /** Second line: the source categories / books the request covered, when the domain has them. */
    detail: string | null;
    cachedAt: string;
    expiresAt: string;
    /** The current settings would produce this request (per-run inputs such as a search term aside). */
    matchesSettings: boolean;
    /** The row offers "use these settings": the domain maps to settings and does not match now. */
    adoptable: boolean;
    /** Tooltip for the adopt button: what differs. */
    differences: string;
  }

  interface ISourceBookBrowserCacheGroup {
    domain: TProxyCacheDomain;
    label: string;
    count: number;
    rows: ISourceBookBrowserCacheRow[];
  }

  interface ISourceBookBrowserCacheContext {
    available: boolean;
    enabled: boolean;
    total: number;
    groups: ISourceBookBrowserCacheGroup[];
  }

  /** One selectable field in the Copy Scene Fields tree. */
  interface ISceneCopyFieldDef {
    id: string;
    label: string;
    kind: "doc" | "embedded" | "level";
    /** doc fields: scene property path read/written via get/setProperty */
    path?: string;
    /** embedded fields: scene collection getter (walls, lights, ...) */
    coll?: string;
    /** level fields: property path(s) within each Level, copied per-level */
    paths?: string[];
    default: boolean;
  }

  interface ISceneCopyGroupDef {
    id: string;
    label: string;
    fields: ISceneCopyFieldDef[];
  }

  /** A field group as rendered by the scene copy templates. */
  interface ISceneCopyFieldTreeGroup {
    id: string;
    label: string;
    expanded: boolean;
    fields: { id: string; label: string; selected: boolean }[];
    allSelected: boolean;
    someSelected: boolean;
  }

  /** One source -> target pair in the batch scene copy. */
  interface ISceneCopyMapping {
    sourceId: string | null;
    targetId: string | null;
    /** how a folder match paired the scenes; "loose" pairs are flagged for review */
    matchedBy?: "name" | "loose";
    status?: "running" | "ok" | "error";
    error?: string;
  }

  /** A scene considered for folder name matching, with its folder path relative to the matched root. */
  interface ISceneCopyMatchCandidate {
    id: string;
    name: string;
    relPath: string;
  }

  interface ISceneCopyBatchResult {
    sourceId: string | null;
    targetId: string | null;
    sourceName: string;
    targetName: string;
    ok: boolean;
    error?: string;
  }

  /**
   * Options for the batch scene copy API. Scenes may be passed as documents, ids or names; folders
   * also accept a path such as "Adventures/Red Wizards Gambit" to pick a nested folder, and a bare
   * name resolves to the least nested folder with that name. `fields` accepts field ids ("doc:grid", "walls", "lvl-name", "flag:ddb") and group ids
   * ("scene", "embedded", "levels", "flags"); omitted, each field's default applies.
   */
  interface ISceneCopyBatchOptions {
    mappings?: { source: Scene | string; target: Scene | string }[];
    sourceFolder?: Folder | string;
    targetFolder?: Folder | string;
    includeSubfolders?: boolean;
    fields?: string[];
  }

  interface IMonsterReplacerData {
    id2014: number;
    name2014: string;
    id2024: number;
    name2024: string;
  }
};
