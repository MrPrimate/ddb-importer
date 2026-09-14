import logger from "../../lib/Logger";

// Scene schema keys that are never copied as document fields:
//  - identity / state:    _id, _stats, name, active, thumb, ownership, folder, sort
//  - handled separately:  flags (own group), levels (own group), every embedded
//                         collection (own group)
//  - cross-scene id ref:  initialLevel (points at a level id that won't exist
//                         on the target after copy)
// Everything else on the Scene schema becomes a selectable "doc" field, so the
// list stays complete as the schema evolves (shiftX/shiftY, transition, etc.).
const EMBEDDED_COLLECTIONS = ["walls", "lights", "sounds", "drawings", "tiles", "notes", "regions", "tokens"];
const DOC_EXCLUDE = new Set<string>([
  "_id", "_stats", "flags", "name", "active", "thumb", "ownership", "folder", "sort",
  "initialLevel", "levels", ...EMBEDDED_COLLECTIONS,
]);
// Doc fields off by default (everything else defaults on).
const DOC_DEFAULT_OFF = new Set<string>([]);
// Friendly labels; unmapped keys are humanised from the schema key.
const DOC_LABELS: Record<string, string> = {
  width: "Width",
  height: "Height",
  padding: "Padding",
  shiftX: "Shift X",
  shiftY: "Shift Y",
  grid: "Grid Configuration",
  initial: "Initial View Position",
  tokenVision: "Token Vision",
  fog: "Fog of War",
  environment: "Environment / Lighting",
  transition: "Scene Transition",
  weather: "Weather Effect",
  navigation: "Show in Navigation",
  navName: "Navigation Name",
  navOrder: "Navigation Order",
  playlist: "Playlist",
  playlistSound: "Playlist Sound",
  journal: "Journal Entry",
  journalEntryPage: "Journal Page",
  backgroundColor: "Background Colour",
};

function humaniseKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

// Static groups for the collection-based fields. The document-field group is
// built from the Scene schema in `sceneFieldGroups()`.
const FIELD_GROUPS: ISceneCopyGroupDef[] = [
  {
    id: "embedded",
    label: "Placed Objects",
    fields: [
      { id: "walls", label: "Walls", kind: "embedded", coll: "walls", default: true },
      { id: "lights", label: "Lights", kind: "embedded", coll: "lights", default: true },
      { id: "sounds", label: "Sounds", kind: "embedded", coll: "sounds", default: true },
      { id: "drawings", label: "Drawings", kind: "embedded", coll: "drawings", default: true },
      { id: "tiles", label: "Tiles", kind: "embedded", coll: "tiles", default: true },
      { id: "notes", label: "Notes", kind: "embedded", coll: "notes", default: true },
      { id: "regions", label: "Regions", kind: "embedded", coll: "regions", default: true },
      { id: "tokens", label: "Tokens (unlinked only)", kind: "embedded", coll: "tokens", default: true },
    ],
  },
  {
    // v14: each Level holds the background/foreground/fog. Level fields are
    // copied onto the target's matching level (by order) in place - levels are
    // never deleted (Foundry requires at least one). Image fields are off by
    // default so map images are not carried between scenes.
    id: "levels",
    label: "Levels",
    fields: [
      { id: "lvl-name", label: "Name", kind: "level", paths: ["name"], default: true },
      { id: "lvl-elevation", label: "Elevation Range", kind: "level", paths: ["elevation"], default: true },
      { id: "lvl-bg-color", label: "Background Colour & Tint", kind: "level", paths: ["background.color", "background.tint", "background.alphaThreshold"], default: true },
      { id: "lvl-bg-image", label: "Background Image", kind: "level", paths: ["background.src"], default: false },
      { id: "lvl-fg-tint", label: "Foreground Tint", kind: "level", paths: ["foreground.tint", "foreground.alphaThreshold"], default: true },
      { id: "lvl-fg-image", label: "Foreground Image", kind: "level", paths: ["foreground.src"], default: false },
      { id: "lvl-fog-tint", label: "Fog Tint", kind: "level", paths: ["fog.tint"], default: true },
      { id: "lvl-fog-image", label: "Fog Image", kind: "level", paths: ["fog.src"], default: false },
      { id: "lvl-textures", label: "Texture Transform", kind: "level", paths: ["textures"], default: true },
      { id: "lvl-visibility", label: "Visibility", kind: "level", paths: ["visibility"], default: true },
      { id: "lvl-sort", label: "Sort Order", kind: "level", paths: ["sort"], default: true },
    ],
  },
];

/**
 * "Parent / Child / " prefix walking a document's folder ancestry, so dropdowns
 * show where each scene lives. Empty string for top-level documents.
 */
export function sceneFolderPath(doc: any): string {
  const names: string[] = [];
  let folder = doc?.folder;
  while (folder) {
    names.unshift(folder.name);
    folder = folder.folder;
  }
  return names.length ? `${names.join(" / ")} / ` : "";
}

// Document fields, derived from the Scene schema so the set stays complete
// (shiftX/shiftY, transition, playlist, ...). Identity/state keys, flags,
// levels and the embedded collections are excluded (handled elsewhere).
function docFields(): ISceneCopyFieldDef[] {
  const keys = Object.keys(foundry.documents.Scene.schema.fields);
  return keys
    .filter((k) => !DOC_EXCLUDE.has(k))
    .sort((a, b) => (DOC_LABELS[a] ?? humaniseKey(a)).localeCompare(DOC_LABELS[b] ?? humaniseKey(b)))
    .map((k) => ({
      id: `doc:${k}`,
      label: DOC_LABELS[k] ?? humaniseKey(k),
      kind: "doc" as const,
      path: k,
      default: !DOC_DEFAULT_OFF.has(k),
    }));
}

// Top-level flag scopes present on any of the source scenes (e.g.
// "tokenizer-2", "ddb"). Each becomes a doc field copied via flags.<scope>;
// all are deselected by default.
function flagFields(sources: any[]): ISceneCopyFieldDef[] {
  const scopes = new Set<string>();
  for (const source of sources) {
    for (const scope of Object.keys(source?.flags ?? {})) scopes.add(scope);
  }
  return Array.from(scopes).sort().map((scope) => ({
    id: `flag:${scope}`,
    label: scope,
    kind: "doc" as const,
    path: `flags.${scope}`,
    default: false,
  }));
}

/** "Scene Fields" from the schema, the static collection groups, and "Flags" when any source has some. */
export function sceneFieldGroups(sources: any[] = []): ISceneCopyGroupDef[] {
  const groups: ISceneCopyGroupDef[] = [
    { id: "scene", label: "Scene Fields", fields: docFields() },
    ...FIELD_GROUPS,
  ];
  const flags = flagFields(sources);
  if (flags.length) {
    groups.push({ id: "flags", label: "Flags (module data)", fields: flags });
  }
  return groups;
}

export function defaultSceneFieldIds(groups: ISceneCopyGroupDef[]): string[] {
  return groups.flatMap((g) => g.fields).filter((f) => f.default).map((f) => f.id);
}

/** Expand group ids to their field ids; field ids pass through and unknown ids are dropped with a warning. */
export function expandSceneFieldIds(groups: ISceneCopyGroupDef[], ids: Iterable<string>): string[] {
  const fieldIds = new Set(groups.flatMap((g) => g.fields.map((f) => f.id)));
  const result = new Set<string>();
  for (const id of ids) {
    const group = groups.find((g) => g.id === id);
    if (group) {
      for (const f of group.fields) result.add(f.id);
    } else if (fieldIds.has(id)) {
      result.add(id);
    } else {
      logger.warn(`SceneCopy: unknown field or group "${id}", ignoring.`);
    }
  }
  return Array.from(result);
}

/** Template context for the collapsible field tree. */
export function sceneFieldTree(groups: ISceneCopyGroupDef[], selected: Set<string>, expanded: Set<string>): ISceneCopyFieldTreeGroup[] {
  return groups.map((g) => {
    const fields = g.fields.map((f) => ({ id: f.id, label: f.label, selected: selected.has(f.id) }));
    const selectedCount = fields.filter((f) => f.selected).length;
    return {
      id: g.id,
      label: g.label,
      expanded: expanded.has(g.id),
      fields,
      allSelected: selectedCount === fields.length,
      someSelected: selectedCount > 0 && selectedCount < fields.length,
    };
  });
}

/** Select every field in the group, or clear them all when they are already all selected. */
export function toggleSceneFieldGroup(group: ISceneCopyGroupDef, selected: Set<string>): void {
  const allOn = group.fields.every((f) => selected.has(f.id));
  for (const f of group.fields) {
    if (allOn) selected.delete(f.id);
    else selected.add(f.id);
  }
}

/** Tri-state group checkboxes; `indeterminate` has no HTML attribute so it is set after render. */
export function markIndeterminateGroups(root: HTMLElement, groups: ISceneCopyGroupDef[], selected: Set<string>): void {
  for (const g of groups) {
    const cb = root.querySelector<HTMLInputElement>(`.ddb-scene-copy-group-check[data-group="${g.id}"]`);
    if (!cb) continue;
    const count = g.fields.filter((f) => selected.has(f.id)).length;
    cb.indeterminate = count > 0 && count < g.fields.length;
  }
}

/** Copy the chosen fields from one scene onto another. */
export async function copySceneFields(source: any, target: any, fieldIds: Iterable<string>): Promise<void> {
  const ids = new Set(fieldIds);
  // groups are built from this source alone, so flag scopes it lacks are skipped
  const chosen = sceneFieldGroups([source]).flatMap((g) => g.fields).filter((f) => ids.has(f.id));

  // 1. Document fields -> single update. Read from `_source` (raw stored
  // data) rather than live getters so we don't trip deprecation shims (e.g.
  // v14 moved Scene#backgroundColor/foreground onto Level).
  const update: Record<string, any> = {};
  for (const f of chosen.filter((f) => f.kind === "doc")) {
    update[f.path!] = foundry.utils.deepClone(foundry.utils.getProperty(source._source, f.path!));
  }
  if (Object.keys(update).length) await target.update(update);

  // 2. Embedded collections -> replace. Create the source docs first, THEN
  // delete the target's originals, avoiding any transient empty state.
  for (const f of chosen.filter((f) => f.kind === "embedded")) {
    const coll = f.coll!;
    const srcColl = source[coll];
    if (!srcColl) {
      logger.warn(`SceneCopy: source scene has no "${coll}" collection, skipping.`);
      continue;
    }
    const docName = srcColl.documentName;
    const existingIds = (target[coll] ?? []).map((d: any) => d.id);
    const srcDocs = coll === "tokens"
      ? srcColl.filter((t: any) => !t.actorLink)
      : Array.from(srcColl);
    const docs = srcDocs.map((d: any) => {
      const o = d.toObject();
      delete o._id;
      return o;
    });

    if (docs.length) await target.createEmbeddedDocuments(docName, docs);
    if (existingIds.length) await target.deleteEmbeddedDocuments(docName, existingIds);
  }

  // 3. Level fields -> copy only the selected paths onto the target's levels.
  const levelFields = chosen.filter((f) => f.kind === "level");
  if (levelFields.length) await copyLevelFields(source, target, levelFields);
}

// Copy the selected per-level field paths from the source levels onto the
// target. Levels are matched by order and updated IN PLACE (never deleted -
// Foundry requires a scene keep at least one level). Extra source levels are
// created. Only the chosen paths are written, so unselected fields (e.g. the
// image sources, off by default) are left untouched on the target.
async function copyLevelFields(source: any, target: any, levelFields: ISceneCopyFieldDef[]): Promise<void> {
  const srcColl = source.levels;
  if (!srcColl) {
    logger.warn("SceneCopy: source scene has no levels, skipping level fields.");
    return;
  }
  const docName = srcColl.documentName;
  const srcLevels = Array.from(srcColl).map((l: any) => l.toObject());
  const targetLevels = Array.from(target.levels ?? []) as any[];
  const paths = levelFields.flatMap((f) => f.paths ?? []);

  const updates: any[] = [];
  const creates: any[] = [];
  srcLevels.forEach((src, i) => {
    const picked: Record<string, any> = {};
    for (const p of paths) {
      if (!foundry.utils.hasProperty(src, p)) continue;
      foundry.utils.setProperty(picked, p, foundry.utils.deepClone(foundry.utils.getProperty(src, p)));
    }
    if (i < targetLevels.length) {
      updates.push({ ...picked, _id: targetLevels[i].id });
    } else {
      // A new level needs a name (no schema default); fall back to source.
      if (!picked.name) picked.name = src.name ?? "Level";
      creates.push(picked);
    }
  });

  if (updates.length) await target.updateEmbeddedDocuments(docName, updates);
  if (creates.length) await target.createEmbeddedDocuments(docName, creates);
}

/**
 * The scene's folder path below `rootId` ("" when directly inside it), or null
 * when the scene is not under that folder. A null root means top-level scenes.
 */
export function sceneFolderRelativePath(scene: any, rootId: string | null, includeSubfolders: boolean): string | null {
  const names: string[] = [];
  let folder = scene?.folder;
  while (folder) {
    if (folder.id === rootId) return names.join(" / ");
    if (!includeSubfolders) return null;
    names.unshift(folder.name ?? "");
    folder = folder.folder;
  }
  return rootId === null ? names.join(" / ") : null;
}

/** Scenes under a folder, each tagged with its folder path relative to that folder. */
export function scenesInFolder(rootId: string | null, includeSubfolders: boolean, scenes: any[] = game.scenes.contents): ISceneCopyMatchCandidate[] {
  return scenes.flatMap((scene) => {
    const relPath = sceneFolderRelativePath(scene, rootId, includeSubfolders);
    return relPath === null ? [] : [{ id: scene.id as string, name: scene.name ?? "", relPath }];
  });
}

function normaliseName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function groupCandidates(candidates: ISceneCopyMatchCandidate[], key: (c: ISceneCopyMatchCandidate) => string) {
  const groups = new Map<string, ISceneCopyMatchCandidate[]>();
  for (const candidate of candidates) {
    const k = key(candidate);
    const group = groups.get(k);
    if (group) group.push(candidate);
    else groups.set(k, [candidate]);
  }
  return groups;
}

// "Towers" -> "tower", "Galleries" -> "gallery"; short words and "-ss" endings
// ("Pass", "Moss") are left alone
function singularise(word: string): string {
  if (word.length <= 3 || !word.endsWith("s") || word.endsWith("ss")) return word;
  return word.endsWith("ies") ? `${word.slice(0, -3)}y` : word.slice(0, -1);
}

/**
 * Loose comparison key bridging the names the adventure importer gives scenes
 * and the names DDB Maps uses, e.g. "Immilmar Plazas (Player Version)" and
 * "Map: Immilmar Plaza" both become "immilmar plaza". Drops any "Prefix:" and
 * parenthetical suffixes (as NativeSceneBuilder does for navName), punctuation,
 * a leading "the", and a plural "s" on each word.
 */
export function looseSceneNameKey(name: string): string {
  const base = name.split(":").pop()?.trim() || name;
  const stripped = base.replace(/\s*\([^)]*\)/g, " ").trim() || base;
  const words = stripped
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  if (words.length > 1 && words[0] === "the") words.shift();
  return words.map(singularise).join(" ");
}

// "(Player Version)" -> "player"; "" for a name without a version suffix
// (suffixes as NativeSceneApplier.stripSuffix)
function versionTag(name: string): string {
  const match = name.match(/\((Player|Unlabeled|Ungridded|Map|DM) Version\)\s*$/i);
  return match ? match[1].toLowerCase() : "";
}

type TSceneNameKey = (c: ISceneCopyMatchCandidate) => string;

/**
 * Pair source scenes with target scenes by name, in passes from strictest to
 * loosest. Each pass only accepts a target when exactly one unclaimed target
 * shares the key, and within each strictness a target at the same relative
 * folder path is tried first, which keeps same-named maps in different
 * chapters apart. Loose passes compare `looseSceneNameKey`, first requiring the
 * same "(Player Version)" style suffix so player and DM variants pair with
 * their own counterparts when both exist. Ambiguous or missing names are
 * reported as unmatched.
 */
export function matchScenesByName(sources: ISceneCopyMatchCandidate[], targets: ISceneCopyMatchCandidate[]): {
  matches: ISceneCopyMapping[];
  unmatched: ISceneCopyMatchCandidate[];
} {
  const exact: TSceneNameKey = (c) => normaliseName(c.name);
  const loose: TSceneNameKey = (c) => looseSceneNameKey(c.name);
  const samePath = (key: TSceneNameKey): TSceneNameKey => (c) => `${normaliseName(c.relPath)}|${key(c)}`;
  const sameVersion = (key: TSceneNameKey): TSceneNameKey => (c) => `${versionTag(c.name)}|${key(c)}`;
  const passes: { matchedBy: "name" | "loose"; key: TSceneNameKey }[] = [
    { matchedBy: "name", key: samePath(exact) },
    { matchedBy: "name", key: exact },
    { matchedBy: "loose", key: samePath(sameVersion(loose)) },
    { matchedBy: "loose", key: sameVersion(loose) },
    { matchedBy: "loose", key: samePath(loose) },
    { matchedBy: "loose", key: loose },
  ];

  const claimed = new Set<string>();
  const matched = new Map<string, ISceneCopyMapping>();
  for (const pass of passes) {
    const groups = groupCandidates(targets, pass.key);
    for (const source of sources) {
      if (matched.has(source.id) || !exact(source)) continue;
      const hits = (groups.get(pass.key(source)) ?? []).filter((t) => t.id !== source.id && !claimed.has(t.id));
      if (hits.length !== 1) continue;
      claimed.add(hits[0].id);
      matched.set(source.id, { sourceId: source.id, targetId: hits[0].id, matchedBy: pass.matchedBy });
    }
  }

  return {
    matches: sources.flatMap((s) => matched.get(s.id) ?? []),
    unmatched: sources.filter((s) => !matched.has(s.id)),
  };
}

/** Name-match the scenes of two folders. */
export function matchFolderScenes(sourceFolderId: string, targetFolderId: string, includeSubfolders: boolean) {
  return matchScenesByName(
    scenesInFolder(sourceFolderId, includeSubfolders),
    scenesInFolder(targetFolderId, includeSubfolders),
  );
}

/** Scene document, id or name -> scene id. */
export function resolveSceneRef(ref: Scene | string | null | undefined): string | null {
  if (!ref) return null;
  if (typeof ref !== "string") return ref.id ?? null;
  return game.scenes.get(ref)?.id ?? game.scenes.getName(ref)?.id ?? null;
}

// folder names from the root down to this folder
function folderAncestry(folder: any): string[] {
  const names: string[] = [];
  for (let f = folder; f; f = f.folder) names.unshift(f.name ?? "");
  return names;
}

/**
 * Folder document, id, name or path -> scene folder id. A path such as
 * "Adventures/Red Wizards Gambit" matches folders whose ancestry ends with those
 * names, so a bare name also matches nested folders. The least nested match
 * wins, which lets "Red Wizards Gambit" pick the top-level folder over
 * "Adventures/Red Wizards Gambit"; a tie at that depth is reported as ambiguous.
 */
export function resolveFolderRef(ref: Folder | string | null | undefined, folders: any[] = game.folders.contents): string | null {
  if (!ref) return null;
  if (typeof ref !== "string") return ref.id ?? null;
  const sceneFolders = folders.filter((f) => f.type === "Scene");
  const byId = sceneFolders.find((f) => f.id === ref);
  if (byId) return byId.id;

  const parts = ref.split("/").map(normaliseName).filter(Boolean);
  const endsWithPath = (f: any) => {
    const names = folderAncestry(f).map(normaliseName);
    return names.length >= parts.length && parts.every((part, i) => names[names.length - parts.length + i] === part);
  };
  // a folder name that itself contains "/" only matches as a whole name
  let candidates = sceneFolders.filter(endsWithPath);
  if (!candidates.length) candidates = sceneFolders.filter((f) => normaliseName(f.name ?? "") === normaliseName(ref));
  if (!candidates.length) return null;

  const depth = (f: any) => folderAncestry(f).length;
  const shallowest = Math.min(...candidates.map(depth));
  const best = candidates.filter((f) => depth(f) === shallowest);
  if (best.length > 1) {
    logger.warn(`SceneCopy: folder "${ref}" is ambiguous, using "${folderAncestry(best[0]).join(" / ")}". Pass a folder path or id to choose another.`, {
      matches: best.map((f) => folderAncestry(f).join(" / ")),
    });
  }
  return best[0].id;
}

/** Normalise the API options, reporting any scene or folder that could not be found. */
export function resolveSceneCopyBatchOptions(options: ISceneCopyBatchOptions = {}) {
  const mappings: ISceneCopyMapping[] = (options.mappings ?? []).map(({ source, target }) => {
    const mapping = { sourceId: resolveSceneRef(source), targetId: resolveSceneRef(target) };
    if (!mapping.sourceId) logger.warn("SceneCopy: source scene not found", { source });
    if (!mapping.targetId) logger.warn("SceneCopy: target scene not found", { target });
    return mapping;
  });
  const sourceFolderId = resolveFolderRef(options.sourceFolder);
  const targetFolderId = resolveFolderRef(options.targetFolder);
  if (options.sourceFolder && !sourceFolderId) logger.warn("SceneCopy: source folder not found", { folder: options.sourceFolder });
  if (options.targetFolder && !targetFolderId) logger.warn("SceneCopy: target folder not found", { folder: options.targetFolder });
  return {
    mappings,
    sourceFolderId,
    targetFolderId,
    includeSubfolders: options.includeSubfolders ?? true,
    fields: options.fields ?? null,
  };
}

/**
 * Copy fields across every mapping in turn. A failing pair is recorded and the
 * run moves on, so one bad scene does not stop an adventure-sized batch.
 */
export async function batchCopySceneFields(
  mappings: ISceneCopyMapping[],
  fieldIds: Iterable<string>,
  { onStart, onResult }: {
    onStart?: (mapping: ISceneCopyMapping) => void;
    onResult?: (mapping: ISceneCopyMapping, result: ISceneCopyBatchResult) => void;
  } = {},
): Promise<ISceneCopyBatchResult[]> {
  const ids = Array.from(fieldIds);
  const results: ISceneCopyBatchResult[] = [];
  for (const mapping of mappings) {
    const source = mapping.sourceId ? game.scenes.get(mapping.sourceId) : undefined;
    const target = mapping.targetId ? game.scenes.get(mapping.targetId) : undefined;
    const result: ISceneCopyBatchResult = {
      sourceId: mapping.sourceId,
      targetId: mapping.targetId,
      sourceName: source?.name ?? mapping.sourceId ?? "",
      targetName: target?.name ?? mapping.targetId ?? "",
      ok: false,
    };
    onStart?.(mapping);
    try {
      if (!source || !target) throw new Error("Source or target scene not found.");
      if (source.id === target.id) throw new Error("Source and target are the same scene.");
      await copySceneFields(source, target, ids);
      result.ok = true;
    } catch (error) {
      result.error = (error as Error).message;
      logger.error(`SceneCopy: copy from "${result.sourceName}" to "${result.targetName}" failed: ${result.error}`, error);
    }
    results.push(result);
    onResult?.(mapping, result);
  }
  return results;
}
