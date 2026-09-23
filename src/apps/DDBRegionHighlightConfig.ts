import DDBAppV2 from "./DDBAppV2";
import {
  REGION_HIGHLIGHT_LIMITS,
  REGION_HIGHLIGHT_PATTERN_LABELS,
  REGION_HIGHLIGHT_PATTERNS,
} from "../config/regionHighlightProfiles";
import { highlightFlag } from "../hooks/canvas/regionHighlight";
import { profileOptions } from "../hooks/canvas/regionHighlightPicker";
import { previewCss } from "../hooks/canvas/regionHighlightPreview";
import {
  behaviorConfigFromFlag,
  describeHighlightFlag,
  flagFromBehaviorConfig,
  REGION_HIGHLIGHT_FALLBACK_COLOR,
  REGION_HIGHLIGHT_FLAG_KEYS,
  REGION_HIGHLIGHT_NUMERIC_OVERRIDES,
} from "../hooks/canvas/regionHighlightSummary";
import logger from "../lib/Logger";
import RegionHighlightProfiles from "../lib/RegionHighlightProfiles";

/** Where a region's highlight choice lives on its document. */
export const REGION_HIGHLIGHT_FLAG_PATH = "flags.ddbimporter.highlight";

/** Pixel size of one grid square in the two previews: the strip and the single enlarged square. */
const PREVIEW_GRID = 50;
const PREVIEW_GRID_LARGE = 150;

interface IRegionHighlightConfigFormValues {
  profile?: string;
  pattern?: string;
  dashed?: string;
  border?: string;
  opacity?: number | string;
  gapOpacity?: number | string;
  borderOpacity?: number | string;
  spacing?: number | string;
  thickness?: number | string;
  edgeWidth?: number | string;
  dashLength?: number | string;
  angle?: number | string;
  borderWidth?: number | string;
  useProfileColor?: boolean;
  color?: string | null;
}

interface IRegionLike {
  id?: string | null;
  uuid?: string | null;
  name?: string;
  color?: unknown;
  flags?: Record<string, unknown>;
  update?: (data: Record<string, unknown>) => Promise<unknown>;
}

interface IActivityLike {
  uuid?: string | null;
  name?: string;
  item?: { name?: string } | null;
  toObject?: () => { behaviors?: { _id?: string; type?: string; config?: Record<string, unknown> }[] };
  update?: (data: Record<string, unknown>) => Promise<unknown>;
}

/**
 * What the editor edits. A region keeps its flag on the document; an activity's appearance
 * behavior keeps the same choice in its config, so the editor speaks in flags and each
 * target translates on the way in and out.
 */
export interface IHighlightTarget {
  /** Instance key, so one window serves one target. */
  key: string;
  title: string;
  /** The colour a profile without its own takes in the previews. */
  color: string;
  read(): IRegionHighlightFlag;
  write(flag: IRegionHighlightFlag): Promise<unknown>;
}

/** A region document: the flag is read and written in place. */
export function regionHighlightTarget(region: IRegionLike): IHighlightTarget {
  return {
    key: region.uuid ?? String(region.id),
    title: `Region Texture${region.name ? `: ${region.name}` : ""}`,
    color: typeof region.color === "string" && region.color ? region.color : REGION_HIGHLIGHT_FALLBACK_COLOR,
    read: () => ({ ...(highlightFlag(region as RegionDocument.Implementation) ?? {}) }),
    write: async (flag) => {
      const previous = highlightFlag(region as RegionDocument.Implementation);
      return region.update?.(DDBRegionHighlightConfig.updateData(previous, flag));
    },
  };
}

/**
 * One `ddbHighlight` behavior on an activity, found by its id so an open editor survives
 * the list being reordered. dnd5e replaces the whole behaviors array on update, so the
 * write rebuilds the array from the activity's source with just this config changed.
 */
export function activityBehaviorHighlightTarget(activity: IActivityLike, behaviorId: string): IHighlightTarget {
  const find = () => (activity.toObject?.().behaviors ?? []).find((behavior) => behavior._id === behaviorId);
  const item = activity.item?.name ? `${activity.item.name}: ` : "";
  return {
    key: `${activity.uuid ?? "activity"}.behavior.${behaviorId}`,
    title: `Region Texture: ${item}${activity.name ?? "Activity"}`,
    color:
      typeof game.user?.color === "string" && game.user.color
        ? String(game.user.color)
        : REGION_HIGHLIGHT_FALLBACK_COLOR,
    read: () => flagFromBehaviorConfig(find()?.config),
    write: async (flag) => {
      const behaviors = activity.toObject?.().behaviors ?? [];
      const entry = behaviors.find((behavior) => behavior._id === behaviorId);
      if (!entry) throw new Error(`Behavior ${behaviorId} no longer exists on ${activity.uuid}`);
      entry.config = { ...(entry.config ?? {}), ...behaviorConfigFromFlag(flag) };
      return activity.update?.({ behaviors });
    },
  };
}

/**
 * Edit one region's highlight, or one activity's appearance behavior: the profile it uses
 * and any overrides. Opened from the "Configure" button in the Region config's appearance
 * tab or beside the behavior on the activity sheet. Saving writes the document directly, as
 * Foundry's own region behavior sheets do, so the host sheet re-renders its summary while
 * it stays open.
 */
export default class DDBRegionHighlightConfig extends DDBAppV2 {
  /** One window per target. */
  static #instances = new Map<string, DDBRegionHighlightConfig>();

  target: IHighlightTarget;

  /** The flag as the form currently describes it. */
  draft: IRegionHighlightFlag;

  /** The last custom colour seen, so unticking "use the profile's colour" brings it back. */
  lastCustomColor: string = REGION_HIGHLIGHT_FALLBACK_COLOR;

  static override DEFAULT_OPTIONS = {
    id: "ddb-region-highlight-config-{id}",
    classes: ["standard-form", "dnd5e2", "ddbi-highlight-config"],
    window: {
      title: "Region Texture",
      icon: "fas fa-draw-polygon",
      resizable: true,
    },
    tag: "form",
    actions: {
      saveHighlight: DDBRegionHighlightConfig.saveHighlight,
      clearHighlight: DDBRegionHighlightConfig.clearHighlight,
      closeApp: DDBRegionHighlightConfig.closeApp,
    },
    position: { width: 560, height: "auto" as const },
  };

  static override PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/region-highlight/region-config.hbs",
    },
  };

  constructor(target: IHighlightTarget) {
    super();
    this.target = target;
    this.draft = target.read();
    if (typeof this.draft.color === "string" && this.draft.color) this.lastCustomColor = this.draft.color;
  }

  /** Show the editor for a target, reusing its open window. */
  static openTarget(target: IHighlightTarget): DDBRegionHighlightConfig {
    let app = DDBRegionHighlightConfig.#instances.get(target.key);
    if (!app) {
      app = new DDBRegionHighlightConfig(target);
      DDBRegionHighlightConfig.#instances.set(target.key, app);
    }
    app.render({ force: true });
    return app;
  }

  /** Show the editor for a region document. */
  static open(region: IRegionLike): DDBRegionHighlightConfig {
    return DDBRegionHighlightConfig.openTarget(regionHighlightTarget(region));
  }

  /** Show the editor for an activity's `ddbHighlight` behavior. */
  static openForBehavior(activity: IActivityLike, behaviorId: string): DDBRegionHighlightConfig {
    return DDBRegionHighlightConfig.openTarget(activityBehaviorHighlightTarget(activity, behaviorId));
  }

  override get title(): string {
    return this.target.title;
  }

  _getTabs(): IDDBTabs {
    return {};
  }

  /**
   * Fold the form's values into a flag. Blank selects and inputs mean "the profile's value"
   * and are left out of the flag altogether; numbers are clamped to the field limits. The
   * colour picker only exists while the profile-colour box is unticked, so unticking it
   * falls back to the last custom colour.
   */
  static flagFromForm(
    values: IRegionHighlightConfigFormValues,
    draft: IRegionHighlightFlag,
    lastCustomColor: string,
  ): { flag: IRegionHighlightFlag; lastCustomColor: string } {
    const flag: IRegionHighlightFlag = { profile: values.profile ?? draft.profile ?? "" };
    const pattern = values.pattern ?? draft.pattern;
    if (RegionHighlightProfiles.isPattern(pattern)) flag.pattern = pattern;
    const dashed = values.dashed ?? draft.dashed;
    if (dashed === "dashed" || dashed === "continuous") flag.dashed = dashed;
    const border = values.border ?? draft.border;
    if (border === "border" || border === "none") flag.border = border;
    for (const { key } of REGION_HIGHLIGHT_NUMERIC_OVERRIDES) {
      // a blank number input reads as null, which clears the override; only a field the form
      // does not show at all falls back to the draft
      const raw = key in values ? values[key] : draft[key];
      if (raw === "" || raw === null || raw === undefined) continue;
      const value = RegionHighlightProfiles.clamp(key, raw, NaN);
      if (Number.isFinite(value)) flag[key] = value;
    }
    const picked = typeof values.color === "string" && values.color.trim() ? values.color.trim() : null;
    const current = typeof draft.color === "string" && draft.color.trim() ? draft.color.trim() : null;
    const remembered = picked ?? current ?? lastCustomColor;
    const useProfileColor = values.useProfileColor ?? current === null;
    if (!useProfileColor) flag.color = remembered;
    return { flag, lastCustomColor: remembered };
  }

  /**
   * The region document update that turns the stored flag into the edited one: each key it
   * now carries is set and each it dropped is deleted, so a cleared override does not linger
   * in the merge. Without a profile the whole flag goes.
   */
  static updateData(
    previous: IRegionHighlightFlag | null | undefined,
    next: IRegionHighlightFlag,
  ): Record<string, unknown> {
    if (!next.profile) return { "flags.ddbimporter.-=highlight": null };
    const update: Record<string, unknown> = {};
    for (const key of REGION_HIGHLIGHT_FLAG_KEYS) {
      const value = next[key];
      if (value !== undefined && value !== "" && value !== null) {
        update[`${REGION_HIGHLIGHT_FLAG_PATH}.${key}`] = value;
      } else if (previous && previous[key] !== undefined) {
        update[`${REGION_HIGHLIGHT_FLAG_PATH}.-=${key}`] = null;
      }
    }
    return update;
  }

  override async _prepareContext(options: any) {
    const context = (await super._prepareContext({ ...options, noCacheLoad: true })) as any;
    const draft = this.draft;
    const style = RegionHighlightProfiles.resolve(draft);
    const previewColor = this.target.color;
    context.profileOptions = profileOptions("None (Foundry default)").map((option) => ({
      ...option,
      selected: option.value === (draft.profile ?? ""),
    }));
    context.hasProfile = Boolean(draft.profile);
    context.patternOptions = [
      { value: "", label: "Profile default", selected: !RegionHighlightProfiles.isPattern(draft.pattern) },
      ...REGION_HIGHLIGHT_PATTERNS.map((value) => ({
        value,
        label: REGION_HIGHLIGHT_PATTERN_LABELS[value],
        selected: value === draft.pattern,
      })),
    ];
    const dashed = RegionHighlightProfiles.dashedValue(draft.dashed);
    context.dashedOptions = [
      { value: "", label: "Profile default", selected: dashed === null },
      { value: "dashed", label: "Dashed", selected: dashed === true },
      { value: "continuous", label: "Continuous", selected: dashed === false },
    ];
    const border = RegionHighlightProfiles.borderValue(draft.border);
    context.borderOptions = [
      { value: "", label: "Profile default", selected: border === null },
      { value: "border", label: "Border", selected: border === true },
      { value: "none", label: "No border", selected: border === false },
    ];
    context.numericFields = REGION_HIGHLIGHT_NUMERIC_OVERRIDES.map(({ key, label, hint }) => {
      const value = RegionHighlightProfiles.clamp(key, draft[key], NaN);
      return {
        key,
        label,
        hint,
        value: Number.isFinite(value) ? value : "",
        limits: REGION_HIGHLIGHT_LIMITS[key],
        // the profile's value shows as the placeholder so a blank field reads as what it inherits
        placeholder: style ? String(style[key]) : "profile",
      };
    });
    const customColor = typeof draft.color === "string" && draft.color.trim() ? draft.color.trim() : null;
    context.useProfileColor = customColor === null;
    context.colorValue = customColor ?? this.lastCustomColor ?? previewColor;
    context.summary = describeHighlightFlag(draft);
    context.previewGrid = PREVIEW_GRID;
    context.previewGridLarge = PREVIEW_GRID_LARGE;
    if (style) {
      context.previewStyle = previewCss(style, previewColor, PREVIEW_GRID);
      context.previewStyleLarge = previewCss(style, previewColor, PREVIEW_GRID_LARGE);
    }
    return context;
  }

  override async _onRender(context: any, options: any) {
    await super._onRender(context, options);
    // number and colour inputs fire input while typing or dragging; keep the previews live.
    // The frame element survives re-renders, so bind once per frame.
    const element = this.element as HTMLElement & { dataset: DOMStringMap };
    if (element.dataset.ddbiInputBound) return;
    element.dataset.ddbiInputBound = "true";
    element.addEventListener("input", () => this.#syncDraftFromForm());
  }

  override _onChangeForm(formConfig: any, event: any) {
    super._onChangeForm(formConfig, event);
    this.#syncDraftFromForm();
    const target = event?.target as HTMLElement | null;
    // the profile changes the placeholders and the summary; the colour box changes which fields show
    if (["profile", "useProfileColor"].includes(target?.getAttribute("name") ?? "")) this.render();
  }

  #formValues(): IRegionHighlightConfigFormValues {
    const form = this.element as HTMLFormElement | null;
    if (!form) return {};
    const FormDataExtended = (
      foundry.applications.ux as unknown as {
        FormDataExtended: new (form: HTMLFormElement) => { object: IRegionHighlightConfigFormValues };
      }
    ).FormDataExtended;
    return new FormDataExtended(form).object;
  }

  #syncDraftFromForm(): void {
    const result = DDBRegionHighlightConfig.flagFromForm(this.#formValues(), this.draft, this.lastCustomColor);
    this.draft = result.flag;
    this.lastCustomColor = result.lastCustomColor;
    const element = this.element as HTMLElement | null;
    if (!element) return;
    const style = RegionHighlightProfiles.resolve(this.draft);
    for (const preview of element.querySelectorAll<HTMLElement>(".ddbi-highlight-preview")) {
      preview.setAttribute(
        "style",
        style ? previewCss(style, this.target.color, Number(preview.dataset.grid) || PREVIEW_GRID) : "",
      );
    }
    const summary = element.querySelector<HTMLElement>(".ddbi-highlight-summary-text");
    if (summary) summary.textContent = describeHighlightFlag(this.draft);
  }

  static async saveHighlight(this: DDBRegionHighlightConfig): Promise<void> {
    this.#syncDraftFromForm();
    await this.#write(this.draft);
  }

  static async clearHighlight(this: DDBRegionHighlightConfig): Promise<void> {
    this.draft = {};
    await this.#write(this.draft);
  }

  static async closeApp(this: DDBRegionHighlightConfig): Promise<void> {
    await this.close();
  }

  async #write(flag: IRegionHighlightFlag): Promise<void> {
    try {
      await this.target.write(flag);
      await this.close();
    } catch (error) {
      logger.error("Unable to update the region texture", { error, flag, target: this.target.key });
      ui.notifications.error("Unable to update the region texture; see the console.");
    }
  }

  override async close(options?: any) {
    DDBRegionHighlightConfig.#instances.delete(this.target.key);
    return super.close(options);
  }
}
