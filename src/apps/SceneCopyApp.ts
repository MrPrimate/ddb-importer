import DDBAppV2 from "./DDBAppV2";
import { logger } from "../lib/_module";
import {
  copySceneFields,
  defaultSceneFieldIds,
  markIndeterminateGroups,
  sceneFieldGroups,
  sceneFieldTree,
  sceneFolderPath,
  toggleSceneFieldGroup,
} from "./lib/sceneFieldCopy";

export default class SceneCopyApp extends DDBAppV2 {

  source: any;
  targetId: string | null = null;
  expanded: Set<string>;
  selected: Set<string>;

  static override DEFAULT_OPTIONS = {
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

  static override PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/scene-copy/copy.hbs",
    },
  };

  constructor(source: Scene) {
    super();
    this.source = source;
    const groups = this._groups();
    // All groups expanded on open.
    this.expanded = new Set(groups.map((g) => g.id));
    // Seed selection from each field's default (flag scopes default off).
    this.selected = new Set(defaultSceneFieldIds(groups));
  }

  _getTabs() {
    return {};
  }

  _groups(): ISceneCopyGroupDef[] {
    return sceneFieldGroups([this.source]);
  }

  override async _prepareContext(_options: any): Promise<any> {
    const context = await super._prepareContext({ ..._options, noCacheLoad: true });

    const targetScenes = (Array.from(game.scenes) as any[])
      .filter((s) => s.id !== this.source.id)
      .map((s) => ({
        id: s.id as string,
        name: sceneFolderPath(s) + (s.name ?? ""),
        selected: s.id === this.targetId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return foundry.utils.mergeObject(context, {
      sourceName: this.source.name ?? "Scene",
      targetScenes,
      hasTargets: targetScenes.length > 0,
      groups: sceneFieldTree(this._groups(), this.selected, this.expanded),
      canCopy: Boolean(this.targetId) && this.selected.size > 0,
    });
  }

  // ApplicationV2 re-renders on any data-action click, which would discard a
  // <select> choice. Bind the target dropdown via a change listener instead and
  // do NOT re-render - we just stash the id and toggle the copy button.
  override async _onRender(context: any, options: any) {
    await (super._onRender as any)?.(context, options);

    const select = this.element.querySelector<HTMLSelectElement>(".ddb-scene-copy-target");
    if (select) {
      select.addEventListener("change", (event) => {
        const el = event.currentTarget as HTMLSelectElement;
        this.targetId = el.value || null;
        // Copy buttons appear both above the field tree and in the footer.
        const buttons = this.element.querySelectorAll<HTMLButtonElement>("[data-action=\"copyScene\"]");
        for (const button of buttons) button.disabled = !(this.targetId && this.selected.size > 0);
      });
    }

    markIndeterminateGroups(this.element, this._groups(), this.selected);
  }

  static toggleGroup(this: SceneCopyApp, _event: any, target: HTMLElement) {
    const id = target?.dataset?.group;
    if (!id) return;
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
    this.render();
  }

  static toggleField(this: SceneCopyApp, _event: any, target: HTMLElement) {
    const id = target?.dataset?.field;
    if (!id) return;
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this.render();
  }

  static toggleGroupAll(this: SceneCopyApp, _event: any, target: HTMLElement) {
    const group = this._groups().find((g) => g.id === target?.dataset?.group);
    if (!group) return;
    toggleSceneFieldGroup(group, this.selected);
    this.render();
  }

  static selectAll(this: SceneCopyApp) {
    for (const f of this._groups().flatMap((g) => g.fields)) this.selected.add(f.id);
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
      await copySceneFields(this.source, target, this.selected);
      ui.notifications?.info(`Copied scene fields from "${this.source.name}" to "${target.name}".`);
      this.close();
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`SceneCopy: copy failed: ${msg}`, error);
      ui.notifications?.error(`Scene copy failed: ${msg}`);
    }
  }

}
