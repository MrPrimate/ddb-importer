import DDBAppV2 from "./DDBAppV2";
import { logger } from "../lib/_module";

interface IFieldDef {
  id: string;
  label: string;
  kind: "doc" | "embedded" | "level";
  // doc fields: scene property path read/written via get/setProperty
  path?: string;
  // embedded fields: scene collection getter (walls, lights, ...)
  coll?: string;
  // level fields: property path(s) within each Level, copied per-level
  paths?: string[];
  default: boolean;
}

interface IGroupDef {
  id: string;
  label: string;
  fields: IFieldDef[];
}

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
// built dynamically from the source scene's schema in `_groups()`.
const FIELD_GROUPS: IGroupDef[] = [
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

export default class SceneCopyApp extends DDBAppV2 {

  source: any;
  targetId: string | null = null;
  expanded: Set<string>;
  selected: Set<string>;

  static DEFAULT_OPTIONS = {
    id: "ddb-scene-copy",
    classes: ["dnd5e2", "ddb-scene-copy-app"],
    window: {
      title: "Copy Scene Fields",
      icon: "fas fa-copy",
      resizable: true,
      minimizable: true,
    },
    actions: {
      toggleGroup: SceneCopyApp.toggleGroup,
      toggleField: SceneCopyApp.toggleField,
      toggleGroupAll: SceneCopyApp.toggleGroupAll,
      selectAll: SceneCopyApp.selectAll,
      deselectAll: SceneCopyApp.deselectAll,
      copyScene: SceneCopyApp.copyScene,
      cancel: SceneCopyApp.cancel,
    },
    position: { width: 520, height: "auto" as const },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/scene-copy/copy.hbs",
    },
  };

  constructor(source: Scene) {
    super();
    this.source = source;
    // All groups expanded on open.
    this.expanded = new Set(this._groups().map((g) => g.id));
    // Seed selection from each field's default (flag scopes default off).
    this.selected = new Set(this._allFields().filter((f) => f.default).map((f) => f.id));
  }

  _getTabs() {
    return {};
  }

  // "Parent / Child / " prefix walking the scene's folder ancestry, so the
  // dropdown shows where each scene lives. Empty string for top-level scenes.
  static _folderPath(scene: any): string {
    const names: string[] = [];
    let folder = scene.folder;
    while (folder) {
      names.unshift(folder.name);
      folder = folder.folder;
    }
    return names.length ? `${names.join(" / ")} / ` : "";
  }

  // Document fields, derived from the source scene's schema so the set stays
  // complete (shiftX/shiftY, transition, playlist, ...). Identity/state keys,
  // flags, levels and the embedded collections are excluded (handled elsewhere).
  _docFields(): IFieldDef[] {
    const keys: string[] = Object.keys(this.source?.schema?.fields ?? {});
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

  // Top-level flag scopes on the source scene (e.g. "tokenizer-2", "ddb").
  // Each becomes a selectable doc field copied via flags.<scope>; all are
  // deselected by default.
  _flagFields(): IFieldDef[] {
    const scopes = Object.keys(this.source?.flags ?? {}).sort();
    return scopes.map((scope) => ({
      id: `flag:${scope}`,
      label: scope,
      kind: "doc" as const,
      path: `flags.${scope}`,
      default: false,
    }));
  }

  // Dynamic "Scene Fields" group + static collection groups + dynamic "Flags".
  _groups(): IGroupDef[] {
    const groups: IGroupDef[] = [
      { id: "scene", label: "Scene Fields", fields: this._docFields() },
      ...FIELD_GROUPS,
    ];
    const flagFields = this._flagFields();
    if (flagFields.length) {
      groups.push({ id: "flags", label: "Flags (module data)", fields: flagFields });
    }
    return groups;
  }

  _allFields(): IFieldDef[] {
    return this._groups().flatMap((g) => g.fields);
  }

  async _prepareContext(_options): Promise<any> {
    const context = await super._prepareContext({ ..._options, noCacheLoad: true });

    const targetScenes = (Array.from(game.scenes) as any[])
      .filter((s) => s.id !== this.source.id)
      .map((s) => ({
        id: s.id as string,
        name: SceneCopyApp._folderPath(s) + (s.name ?? ""),
        selected: s.id === this.targetId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const groups = this._groups().map((g) => {
      const fields = g.fields.map((f) => ({
        id: f.id,
        label: f.label,
        selected: this.selected.has(f.id),
      }));
      const selectedCount = fields.filter((f) => f.selected).length;
      return {
        id: g.id,
        label: g.label,
        expanded: this.expanded.has(g.id),
        fields,
        allSelected: selectedCount === fields.length,
        someSelected: selectedCount > 0 && selectedCount < fields.length,
      };
    });

    return foundry.utils.mergeObject(context, {
      sourceName: this.source.name ?? "Scene",
      targetScenes,
      hasTargets: targetScenes.length > 0,
      groups,
      canCopy: Boolean(this.targetId) && this.selected.size > 0,
    });
  }

  // ApplicationV2 re-renders on any data-action click, which would discard a
  // <select> choice. Bind the target dropdown via a change listener instead and
  // do NOT re-render - we just stash the id and toggle the copy button.
  async _onRender(context, options) {
    await (super._onRender as any)?.(context, options);

    const select = this.element.querySelector<HTMLSelectElement>(".ddb-scene-copy-target");
    if (select) {
      select.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLSelectElement;
        this.targetId = el.value || null;
        const button = this.element.querySelector<HTMLButtonElement>("[data-action=\"copyScene\"]");
        if (button) button.disabled = !(this.targetId && this.selected.size > 0);
      });
    }

    // Tri-state group checkboxes.
    for (const g of this._groups()) {
      const cb = this.element.querySelector<HTMLInputElement>(`.ddb-scene-copy-group-check[data-group="${g.id}"]`);
      if (!cb) continue;
      const total = g.fields.length;
      const count = g.fields.filter((f) => this.selected.has(f.id)).length;
      cb.indeterminate = count > 0 && count < total;
    }
  }

  static toggleGroup(this: SceneCopyApp, _event, target: HTMLElement) {
    const id = target?.dataset?.group;
    if (!id) return;
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
    this.render();
  }

  static toggleField(this: SceneCopyApp, _event, target: HTMLElement) {
    const id = target?.dataset?.field;
    if (!id) return;
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this.render();
  }

  static toggleGroupAll(this: SceneCopyApp, _event, target: HTMLElement) {
    const id = target?.dataset?.group;
    const group = this._groups().find((g) => g.id === id);
    if (!group) return;
    const allOn = group.fields.every((f) => this.selected.has(f.id));
    for (const f of group.fields) {
      if (allOn) this.selected.delete(f.id);
      else this.selected.add(f.id);
    }
    this.render();
  }

  static selectAll(this: SceneCopyApp) {
    for (const f of this._allFields()) this.selected.add(f.id);
    this.render();
  }

  static deselectAll(this: SceneCopyApp) {
    this.selected.clear();
    this.render();
  }

  static cancel(this: SceneCopyApp) {
    this.close();
  }

  static async copyScene(this: SceneCopyApp) {
    if (!this.targetId) {
      ui.notifications?.warn("Pick a target scene first.");
      return;
    }
    if (this.selected.size === 0) {
      ui.notifications?.warn("Select at least one field to copy.");
      return;
    }
    const target = game.scenes.get(this.targetId);
    if (!target) {
      ui.notifications?.error("Target scene not found.");
      return;
    }

    try {
      await this._performCopy(target);
      ui.notifications?.info(`Copied scene fields from "${this.source.name}" to "${target.name}".`);
      this.close();
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`SceneCopy: copy failed: ${msg}`, error);
      ui.notifications?.error(`Scene copy failed: ${msg}`);
    }
  }

  async _performCopy(target: any) {
    const chosen = this._allFields().filter((f) => this.selected.has(f.id));

    // 1. Document fields -> single update. Read from `_source` (raw stored
    // data) rather than live getters so we don't trip deprecation shims (e.g.
    // v14 moved Scene#backgroundColor/foreground onto Level).
    const update: Record<string, any> = {};
    for (const f of chosen.filter((f) => f.kind === "doc")) {
      update[f.path!] = foundry.utils.deepClone(foundry.utils.getProperty(this.source._source, f.path!));
    }
    if (Object.keys(update).length) await target.update(update);

    // 2. Embedded collections -> replace. Create the source docs first, THEN
    // delete the target's originals, avoiding any transient empty state.
    for (const f of chosen.filter((f) => f.kind === "embedded")) {
      const coll = f.coll!;
      const srcColl = this.source[coll];
      if (!srcColl) {
        logger.warn(`SceneCopy: source scene has no "${coll}" collection, skipping.`);
        continue;
      }
      const docName = srcColl.documentName;
      const existingIds = (target[coll] ?? []).map((d) => d.id);
      const srcDocs = coll === "tokens"
        ? srcColl.filter((t) => !t.actorLink)
        : Array.from(srcColl);
      const docs = srcDocs.map((d) => {
        const o = d.toObject();
        delete o._id;
        return o;
      });

      if (docs.length) await target.createEmbeddedDocuments(docName, docs);
      if (existingIds.length) await target.deleteEmbeddedDocuments(docName, existingIds);
    }

    // 3. Level fields -> copy only the selected paths onto the target's levels.
    const levelFields = chosen.filter((f) => f.kind === "level");
    if (levelFields.length) await this._copyLevelFields(target, levelFields);
  }

  // Copy the selected per-level field paths from the source levels onto the
  // target. Levels are matched by order and updated IN PLACE (never deleted -
  // Foundry requires a scene keep at least one level). Extra source levels are
  // created. Only the chosen paths are written, so unselected fields (e.g. the
  // image sources, off by default) are left untouched on the target.
  async _copyLevelFields(target: any, levelFields: IFieldDef[]) {
    const srcColl = this.source.levels;
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

}
