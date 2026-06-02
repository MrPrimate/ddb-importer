import DDBAppV2 from "./DDBAppV2";
import { logger } from "../lib/_module";

interface IFieldDef {
  id: string;
  label: string;
  kind: "doc" | "embedded";
  // doc fields: scene property path read/written via get/setProperty
  path?: string;
  // embedded fields: scene collection getter (walls, lights, ...)
  coll?: string;
  default: boolean;
}

interface IGroupDef {
  id: string;
  label: string;
  fields: IFieldDef[];
}

// Field set mirrors collectSceneData (SceneEnhancerExport.ts). Two kinds:
//  - "doc":      copied via target.update({ [path]: deepClone(getProperty(source, path)) })
//  - "embedded": copied by replacing the target's collection (delete-all then create)
// Flags are intentionally absent (never copied). The scene background image is
// a selectable doc field but off by default; level background images are
// stripped on copy.
const FIELD_GROUPS: IGroupDef[] = [
  {
    id: "dimensions",
    label: "Dimensions & Background",
    fields: [
      { id: "width", label: "Width", kind: "doc", path: "width", default: true },
      { id: "height", label: "Height", kind: "doc", path: "height", default: true },
      { id: "padding", label: "Padding", kind: "doc", path: "padding", default: true },
      { id: "backgroundColor", label: "Background Colour", kind: "doc", path: "backgroundColor", default: true },
      { id: "background", label: "Background Image", kind: "doc", path: "background", default: false },
      { id: "foreground", label: "Foreground Image", kind: "doc", path: "foreground", default: true },
      { id: "foregroundElevation", label: "Foreground Elevation", kind: "doc", path: "foregroundElevation", default: true },
    ],
  },
  {
    id: "grid",
    label: "Grid",
    fields: [
      { id: "grid", label: "Grid Configuration", kind: "doc", path: "grid", default: true },
    ],
  },
  {
    id: "vision",
    label: "Lighting & Vision",
    fields: [
      { id: "tokenVision", label: "Token Vision", kind: "doc", path: "tokenVision", default: true },
      { id: "fog", label: "Fog of War", kind: "doc", path: "fog", default: true },
      { id: "environment", label: "Environment / Lighting", kind: "doc", path: "environment", default: true },
    ],
  },
  {
    id: "view",
    label: "Initial View",
    fields: [
      { id: "initial", label: "Initial View Position", kind: "doc", path: "initial", default: true },
    ],
  },
  {
    id: "nav",
    label: "Navigation",
    fields: [
      { id: "navName", label: "Navigation Name", kind: "doc", path: "navName", default: true },
      { id: "navOrder", label: "Navigation Order", kind: "doc", path: "navOrder", default: true },
      { id: "navigation", label: "Show in Navigation", kind: "doc", path: "navigation", default: true },
    ],
  },
  {
    id: "weather",
    label: "Weather",
    fields: [
      { id: "weather", label: "Weather Effect", kind: "doc", path: "weather", default: true },
    ],
  },
  {
    id: "embedded",
    label: "Placed Objects",
    fields: [
      { id: "walls", label: "Walls", kind: "embedded", coll: "walls", default: true },
      { id: "lights", label: "Lights", kind: "embedded", coll: "lights", default: true },
      { id: "sounds", label: "Sounds", kind: "embedded", coll: "sounds", default: true },
      { id: "drawings", label: "Drawings", kind: "embedded", coll: "drawings", default: true },
      { id: "tiles", label: "Tiles", kind: "embedded", coll: "tiles", default: true },
      { id: "templates", label: "Measured Templates", kind: "embedded", coll: "templates", default: true },
      { id: "notes", label: "Notes", kind: "embedded", coll: "notes", default: true },
      { id: "regions", label: "Regions", kind: "embedded", coll: "regions", default: true },
      { id: "tokens", label: "Tokens (unlinked only)", kind: "embedded", coll: "tokens", default: true },
      { id: "levels", label: "Levels (images stripped)", kind: "embedded", coll: "levels", default: true },
    ],
  },
];

export default class SceneCopyApp extends DDBAppV2 {

  source: Scene;
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

  // Static groups plus a dynamic "Flags" group (only when the scene has flags).
  _groups(): IGroupDef[] {
    const flagFields = this._flagFields();
    if (!flagFields.length) return FIELD_GROUPS;
    return [
      ...FIELD_GROUPS,
      { id: "flags", label: "Flags (module data)", fields: flagFields },
    ];
  }

  _allFields(): IFieldDef[] {
    return this._groups().flatMap((g) => g.fields);
  }

  async _prepareContext(_options): Promise<any> {
    const context = await super._prepareContext({ ..._options, noCacheLoad: true });

    const targetScenes = (Array.from(game.scenes) as any[])
      .filter((s) => s.id !== this.source.id)
      .map((s) => ({ id: s.id as string, name: (s.name ?? "") as string, selected: s.id === this.targetId }))
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

  async _performCopy(target: Scene) {
    const chosen = this._allFields().filter((f) => this.selected.has(f.id));

    // 1. Document fields -> single update.
    const update: Record<string, any> = {};
    for (const f of chosen.filter((f) => f.kind === "doc")) {
      update[f.path!] = foundry.utils.deepClone(foundry.utils.getProperty(this.source, f.path!));
    }
    if (Object.keys(update).length) await target.update(update);

    // 2. Embedded collections -> replace (delete target's existing, create from source).
    for (const f of chosen.filter((f) => f.kind === "embedded")) {
      const coll = f.coll!;
      const srcColl = this.source[coll];
      if (!srcColl) {
        logger.warn(`SceneCopy: source scene has no "${coll}" collection, skipping.`);
        continue;
      }
      const docName = srcColl.documentName;

      const existingIds = (target[coll] ?? []).map((d) => d.id);
      if (existingIds.length) await target.deleteEmbeddedDocuments(docName, existingIds);

      const srcDocs = coll === "tokens"
        ? srcColl.filter((t) => !t.actorLink)
        : Array.from(srcColl);
      const docs = srcDocs.map((d) => {
        const o = d.toObject();
        delete o._id;
        // Per request: do not carry level background images.
        if (coll === "levels" && o.background) delete o.background.src;
        return o;
      });
      if (docs.length) await target.createEmbeddedDocuments(docName, docs);
    }
  }

}
