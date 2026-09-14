import DDBAppV2 from "./DDBAppV2";
import { logger } from "../lib/_module";
import {
  batchCopySceneFields,
  defaultSceneFieldIds,
  expandSceneFieldIds,
  markIndeterminateGroups,
  matchFolderScenes,
  resolveSceneCopyBatchOptions,
  sceneFieldGroups,
  sceneFieldTree,
  sceneFolderPath,
  toggleSceneFieldGroup,
} from "./lib/sceneFieldCopy";

const { DialogV2 } = foundry.applications.api;

type TCompleteMapping = ISceneCopyMapping & { sourceId: string; targetId: string };

const STATUS_ICONS: Record<NonNullable<ISceneCopyMapping["status"]>, string> = {
  running: "fas fa-spinner fa-spin",
  ok: "fas fa-check",
  error: "fas fa-triangle-exclamation",
};

/**
 * Copy Scene Fields across many source -> target scene pairs at once, e.g. from
 * one imported adventure's scenes onto another's. Pairs can be built by hand or
 * name-matched between two scene folders.
 */
export default class SceneCopyBatchApp extends DDBAppV2 {

  mappings: ISceneCopyMapping[];
  sourceFolderId: string | null;
  targetFolderId: string | null;
  includeSubfolders: boolean;
  unmatched: string[] = [];
  expanded: Set<string>;
  selected: Set<string>;
  running = false;

  static override DEFAULT_OPTIONS = {
    id: "ddb-scene-copy-batch",
    classes: ["dnd5e2", "ddb-scene-copy-app", "ddb-scene-copy-batch-app"],
    window: {
      title: "Batch Copy Scene Fields",
      icon: "fas fa-copy",
      resizable: true,
      minimizable: true,
    },
    actions: {
      matchFolders: SceneCopyBatchApp.matchFolders,
      addMapping: SceneCopyBatchApp.addMapping,
      removeMapping: SceneCopyBatchApp.removeMapping,
      clearMappings: SceneCopyBatchApp.clearMappings,
      toggleGroup: SceneCopyBatchApp.toggleGroup,
      toggleField: SceneCopyBatchApp.toggleField,
      toggleGroupAll: SceneCopyBatchApp.toggleGroupAll,
      selectAll: SceneCopyBatchApp.selectAll,
      deselectAll: SceneCopyBatchApp.deselectAll,
      copyScenes: SceneCopyBatchApp.copyScenes,
      cancel: SceneCopyBatchApp.cancel,
    },
    position: { width: 720, height: "auto" as const },
  };

  static override PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/scene-copy/batch.hbs",
    },
  };

  /**
   * Seed the dialog from the API options. When both folders are given and no
   * explicit mappings are, the folders are name-matched straight away.
   */
  constructor(options: ISceneCopyBatchOptions = {}) {
    super();
    const resolved = resolveSceneCopyBatchOptions(options);
    this.mappings = resolved.mappings;
    this.sourceFolderId = resolved.sourceFolderId;
    this.targetFolderId = resolved.targetFolderId;
    this.includeSubfolders = resolved.includeSubfolders;
    if (!this.mappings.length && this.sourceFolderId && this.targetFolderId) this._matchFolders(false);

    const groups = this._groups();
    this.expanded = new Set(groups.map((g) => g.id));
    this.selected = new Set(resolved.fields ? expandSceneFieldIds(groups, resolved.fields) : defaultSceneFieldIds(groups));
  }

  /** Open the batch dialog. */
  static open(options: ISceneCopyBatchOptions = {}): SceneCopyBatchApp {
    const app = new SceneCopyBatchApp(options);
    app.render({ force: true });
    return app;
  }

  /**
   * Run a batch copy without the dialog. Uses `mappings` when given, otherwise
   * name-matches `sourceFolder` onto `targetFolder`.
   */
  static async copy(options: ISceneCopyBatchOptions): Promise<ISceneCopyBatchResult[]> {
    const resolved = resolveSceneCopyBatchOptions(options);
    let mappings = resolved.mappings;
    if (!mappings.length && resolved.sourceFolderId && resolved.targetFolderId) {
      const { matches, unmatched } = matchFolderScenes(resolved.sourceFolderId, resolved.targetFolderId, resolved.includeSubfolders);
      if (unmatched.length) {
        ui.notifications?.warn(`Batch scene copy: no target found for ${unmatched.map((u) => u.name).join(", ")}.`);
      }
      const loose = matches.filter((m) => m.matchedBy === "loose");
      if (loose.length) {
        logger.info(`Batch scene copy: ${loose.length} pair(s) matched by a similar name`, loose.map((m) => ({
          source: game.scenes.get(m.sourceId!)?.name,
          target: game.scenes.get(m.targetId!)?.name,
        })));
      }
      mappings = matches;
    }
    const groups = sceneFieldGroups(mappings.map((m) => (m.sourceId ? game.scenes.get(m.sourceId) : null)));
    const fieldIds = resolved.fields ? expandSceneFieldIds(groups, resolved.fields) : defaultSceneFieldIds(groups);
    return batchCopySceneFields(mappings, fieldIds);
  }

  _getTabs() {
    return {};
  }

  // flag scopes are offered from every mapped source scene
  _groups(): ISceneCopyGroupDef[] {
    const sources = this.mappings.map((m) => (m.sourceId ? game.scenes.get(m.sourceId) : null)).filter(Boolean);
    return sceneFieldGroups(sources);
  }

  _duplicateTargetIds(): Set<string> {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const { sourceId, targetId } of this.mappings) {
      if (!sourceId || !targetId) continue;
      if (seen.has(targetId)) duplicates.add(targetId);
      seen.add(targetId);
    }
    return duplicates;
  }

  // why a mapping row cannot be copied, or null when it can
  _mappingProblem(mapping: ISceneCopyMapping, duplicates: Set<string>): string | null {
    if (!mapping.sourceId || !mapping.targetId) return "Choose both a source and a target scene.";
    if (!game.scenes.get(mapping.sourceId) || !game.scenes.get(mapping.targetId)) return "Scene no longer exists.";
    if (mapping.sourceId === mapping.targetId) return "Source and target are the same scene.";
    if (duplicates.has(mapping.targetId)) return "This target scene is mapped more than once.";
    return null;
  }

  _completeMappings(): TCompleteMapping[] {
    const duplicates = this._duplicateTargetIds();
    return this.mappings.filter((m): m is TCompleteMapping => this._mappingProblem(m, duplicates) === null);
  }

  /**
   * Name-match the chosen folders. Rows for sources that matched are replaced,
   * rows for other sources are kept, and empty rows are dropped.
   */
  _matchFolders(notify = true): void {
    if (!this.sourceFolderId || !this.targetFolderId) {
      if (notify) ui.notifications?.warn("Choose a source and a target folder first.");
      return;
    }
    if (this.sourceFolderId === this.targetFolderId) {
      if (notify) ui.notifications?.warn("Choose two different folders.");
      return;
    }
    const { matches, unmatched } = matchFolderScenes(this.sourceFolderId, this.targetFolderId, this.includeSubfolders);
    const matchedSources = new Set(matches.map((m) => m.sourceId));
    this.mappings = [
      ...this.mappings.filter((m) => m.sourceId && !matchedSources.has(m.sourceId)),
      ...matches,
    ];
    this.unmatched = unmatched.map((u) => (u.relPath ? `${u.relPath} / ${u.name}` : u.name));
    if (notify) {
      const total = matches.length + unmatched.length;
      const loose = matches.filter((m) => m.matchedBy === "loose").length;
      const looseNote = loose ? ` (${loose} by a similar name, marked for review)` : "";
      ui.notifications?.info(`Matched ${matches.length} of ${total} scene(s) by name${looseNote}.`);
    }
  }

  override async _prepareContext(_options: any): Promise<any> {
    const context = await super._prepareContext({ ..._options, noCacheLoad: true });

    const sceneChoices = Object.fromEntries(
      game.scenes.contents
        .map((s) => [s.id as string, sceneFolderPath(s) + (s.name ?? "")])
        .sort((a, b) => a[1].localeCompare(b[1])),
    );
    const folderChoices = Object.fromEntries(
      game.folders.contents
        .filter((f) => f.type === "Scene")
        .map((f) => [f.id as string, sceneFolderPath(f) + (f.name ?? "")])
        .sort((a, b) => a[1].localeCompare(b[1])),
    );

    const duplicates = this._duplicateTargetIds();
    const mappings = this.mappings.map((m, index) => {
      const problem = (m.sourceId || m.targetId) ? this._mappingProblem(m, duplicates) : null;
      const loose = !m.status && !problem && m.matchedBy === "loose";
      let statusIcon = "";
      if (m.status) statusIcon = STATUS_ICONS[m.status];
      else if (problem) statusIcon = "fas fa-circle-exclamation";
      else if (loose) statusIcon = "fas fa-circle-question";
      return {
        index,
        sourceId: m.sourceId ?? "",
        targetId: m.targetId ?? "",
        cssClass: [problem ? "invalid" : "", loose ? "loose" : "", m.status ?? ""].filter(Boolean).join(" "),
        statusIcon,
        statusTooltip: m.error ?? problem ?? (loose ? "Matched by a similar name, check this pair." : ""),
      };
    });

    const complete = this._completeMappings().length;
    return foundry.utils.mergeObject(context, {
      sceneChoices,
      folderChoices,
      sourceFolderId: this.sourceFolderId ?? "",
      targetFolderId: this.targetFolderId ?? "",
      includeSubfolders: this.includeSubfolders,
      canMatch: Boolean(this.sourceFolderId && this.targetFolderId) && !this.running,
      unmatched: this.unmatched,
      mappings,
      completeCount: complete,
      groups: sceneFieldTree(this._groups(), this.selected, this.expanded),
      running: this.running,
      canCopy: complete > 0 && this.selected.size > 0 && duplicates.size === 0 && !this.running,
    });
  }

  // Selects are bound via change listeners: the choice is stored before the
  // re-render, so the rebuilt markup shows it.
  override async _onRender(context: any, options: any) {
    await super._onRender(context, options);

    for (const select of this.element.querySelectorAll<HTMLSelectElement>(".ddb-scene-copy-batch-scene")) {
      select.addEventListener("change", () => {
        const mapping = this.mappings[Number(select.dataset.index)];
        if (!mapping) return;
        if (select.dataset.side === "source") mapping.sourceId = select.value || null;
        else mapping.targetId = select.value || null;
        delete mapping.status;
        delete mapping.error;
        delete mapping.matchedBy;
        this.render();
      });
    }

    for (const select of this.element.querySelectorAll<HTMLSelectElement>(".ddb-scene-copy-batch-folder")) {
      select.addEventListener("change", () => {
        if (select.dataset.side === "source") this.sourceFolderId = select.value || null;
        else this.targetFolderId = select.value || null;
        this.render();
      });
    }

    const subfolders = this.element.querySelector<HTMLInputElement>(".ddb-scene-copy-batch-subfolders");
    subfolders?.addEventListener("change", () => {
      this.includeSubfolders = subfolders.checked;
    });

    markIndeterminateGroups(this.element, this._groups(), this.selected);
  }

  static matchFolders(this: SceneCopyBatchApp) {
    this._matchFolders();
    this.render();
  }

  static addMapping(this: SceneCopyBatchApp) {
    this.mappings.push({ sourceId: null, targetId: null });
    this.render();
  }

  static removeMapping(this: SceneCopyBatchApp, _event: any, target: HTMLElement) {
    const index = Number(target?.dataset?.index);
    if (!Number.isInteger(index)) return;
    this.mappings.splice(index, 1);
    this.render();
  }

  static clearMappings(this: SceneCopyBatchApp) {
    this.mappings = [];
    this.unmatched = [];
    this.render();
  }

  static toggleGroup(this: SceneCopyBatchApp, _event: any, target: HTMLElement) {
    const id = target?.dataset?.group;
    if (!id) return;
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
    this.render();
  }

  static toggleField(this: SceneCopyBatchApp, _event: any, target: HTMLElement) {
    const id = target?.dataset?.field;
    if (!id) return;
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this.render();
  }

  static toggleGroupAll(this: SceneCopyBatchApp, _event: any, target: HTMLElement) {
    const group = this._groups().find((g) => g.id === target?.dataset?.group);
    if (!group) return;
    toggleSceneFieldGroup(group, this.selected);
    this.render();
  }

  static selectAll(this: SceneCopyBatchApp) {
    for (const f of this._groups().flatMap((g) => g.fields)) this.selected.add(f.id);
    this.render();
  }

  static deselectAll(this: SceneCopyBatchApp) {
    this.selected.clear();
    this.render();
  }

  static cancel(this: SceneCopyBatchApp) {
    this.close();
  }

  static async copyScenes(this: SceneCopyBatchApp) {
    if (this.running) return;
    if (this._duplicateTargetIds().size) {
      ui.notifications?.warn("Each target scene can only be mapped once.");
      return;
    }
    const mappings = this._completeMappings();
    if (!mappings.length) {
      ui.notifications?.warn("Add at least one complete scene mapping.");
      return;
    }
    if (this.selected.size === 0) {
      ui.notifications?.warn("Select at least one field to copy.");
      return;
    }

    const proceed = await DialogV2.confirm({
      window: { title: "Batch Copy Scene Fields" },
      content: `<p>Copy the selected fields for <strong>${mappings.length}</strong> scene pair(s)?</p>`
        + `<p>Selected placed object types are replaced on every target scene.</p>`,
      rejectClose: false,
    });
    if (!proceed) return;

    this.running = true;
    for (const mapping of mappings) {
      delete mapping.status;
      delete mapping.error;
    }
    this.render();

    try {
      const results = await batchCopySceneFields(mappings, this.selected, {
        onStart: (mapping) => {
          mapping.status = "running";
          this.render();
        },
        onResult: (mapping, result) => {
          mapping.status = result.ok ? "ok" : "error";
          mapping.error = result.error;
          this.render();
        },
      });
      const failed = results.filter((r) => !r.ok).length;
      if (failed) {
        ui.notifications?.warn(`Copied ${results.length - failed} of ${results.length} scene(s); ${failed} failed, hover the marked rows for details.`);
      } else {
        ui.notifications?.info(`Copied scene fields for ${results.length} scene(s).`);
      }
    } finally {
      this.running = false;
      this.render();
    }
  }

}
