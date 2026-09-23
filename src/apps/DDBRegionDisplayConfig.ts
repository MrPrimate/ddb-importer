import DDBAppV2 from "./DDBAppV2";
import {
  REGION_DISPLAY_FALLBACK_COLOR,
  REGION_DISPLAY_FIELDS,
  REGION_DISPLAY_FLAG_PATH,
  REGION_DISPLAY_LIMITS,
  REGION_DISPLAY_PATTERNS,
} from "../config/regionDisplayProfiles";
import { displayFlag } from "../hooks/canvas/regionDisplay";
import { profileOptions } from "../hooks/canvas/regionDisplayPicker";
import { previewCss } from "../hooks/canvas/regionDisplayPreview";
import {
  behaviorConfigFromFlag,
  describeDisplayFlag,
  flagFromBehaviorConfig,
  REGION_DISPLAY_FLAG_KEYS,
  userPreviewColor,
} from "../hooks/canvas/regionDisplaySummary";
import logger from "../lib/Logger";
import RegionDisplayProfiles from "../lib/RegionDisplayProfiles";
import { bindLiveInput, PREVIEW_GRID, PREVIEW_GRID_LARGE, readForm, resolveColor } from "./lib/regionDisplayForm";

interface IRegionDisplayConfigFormValues {
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
  crossRotation?: number | string;
  crossLength?: number | string;
  waveAmplitude?: number | string;
  waveLength?: number | string;
  offset?: number | string;
  borderWidth?: number | string;
  /** Transient: symbols per grid square, which sets the spacing override; never stored. */
  perSquare?: number | string;
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
export interface IDisplayTarget {
  /** Instance key, so one window serves one target. */
  key: string;
  title: string;
  /** The colour a profile without its own takes in the previews. */
  color: string;
  read(): IRegionDisplayFlag;
  write(flag: IRegionDisplayFlag): Promise<unknown>;
}

/** A region document: the flag is read and written in place. */
export function regionDisplayTarget(region: IRegionLike): IDisplayTarget {
  return {
    key: region.uuid ?? String(region.id),
    title: `Region Display${region.name ? `: ${region.name}` : ""}`,
    color: typeof region.color === "string" && region.color ? region.color : REGION_DISPLAY_FALLBACK_COLOR,
    read: () => ({ ...(displayFlag(region as RegionDocument.Implementation) ?? {}) }),
    write: async (flag) => {
      const previous = displayFlag(region as RegionDocument.Implementation);
      return region.update?.(DDBRegionDisplayConfig.updateData(previous, flag));
    },
  };
}

/**
 * One `ddbDisplay` behavior on an activity, found by its id so an open editor survives
 * the list being reordered. dnd5e replaces the whole behaviors array on update, so the
 * write rebuilds the array from the activity's source with just this config changed.
 */
export function activityBehaviorDisplayTarget(activity: IActivityLike, behaviorId: string): IDisplayTarget {
  const find = () => (activity.toObject?.().behaviors ?? []).find((behavior) => behavior._id === behaviorId);
  const item = activity.item?.name ? `${activity.item.name}: ` : "";
  return {
    key: `${activity.uuid ?? "activity"}.behavior.${behaviorId}`,
    title: `Region Display: ${item}${activity.name ?? "Activity"}`,
    color: userPreviewColor(),
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
 * Edit one region's display, or one activity's region display behavior: the profile it uses
 * and any overrides. Opened from the "Configure" button in the Region config's appearance
 * tab or beside the behavior on the activity sheet. Saving writes the document directly, as
 * Foundry's own region behavior sheets do, so the host sheet re-renders its summary while
 * it stays open.
 */
export default class DDBRegionDisplayConfig extends DDBAppV2 {
  /** One window per target. */
  static #instances = new Map<string, DDBRegionDisplayConfig>();

  target: IDisplayTarget;

  /** The flag as the form currently describes it. */
  draft: IRegionDisplayFlag;

  /** The last custom colour seen, so unticking "use the profile's colour" brings it back. */
  lastCustomColor: string = REGION_DISPLAY_FALLBACK_COLOR;

  static override DEFAULT_OPTIONS = {
    id: "ddb-region-display-config-{id}",
    classes: ["standard-form", "dnd5e2", "ddbi-display-region-config"],
    window: {
      title: "Region Display",
      icon: "fas fa-draw-polygon",
      resizable: true,
    },
    tag: "form",
    actions: {
      saveDisplay: DDBRegionDisplayConfig.saveDisplay,
      clearDisplay: DDBRegionDisplayConfig.clearDisplay,
      closeApp: DDBRegionDisplayConfig.closeApp,
    },
    position: { width: 560, height: "auto" as const },
  };

  static override PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/region-display/region-config.hbs",
    },
  };

  constructor(target: IDisplayTarget) {
    super();
    this.target = target;
    this.draft = target.read();
    if (typeof this.draft.color === "string" && this.draft.color) this.lastCustomColor = this.draft.color;
  }

  /** Show the editor for a target, reusing its open window. */
  static openTarget(target: IDisplayTarget): DDBRegionDisplayConfig {
    let app = DDBRegionDisplayConfig.#instances.get(target.key);
    if (!app) {
      app = new DDBRegionDisplayConfig(target);
      DDBRegionDisplayConfig.#instances.set(target.key, app);
    }
    app.render({ force: true });
    return app;
  }

  /** Show the editor for a region document. */
  static open(region: IRegionLike): DDBRegionDisplayConfig {
    return DDBRegionDisplayConfig.openTarget(regionDisplayTarget(region));
  }

  /** Show the editor for an activity's `ddbDisplay` behavior. */
  static openForBehavior(activity: IActivityLike, behaviorId: string): DDBRegionDisplayConfig {
    return DDBRegionDisplayConfig.openTarget(activityBehaviorDisplayTarget(activity, behaviorId));
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
    values: IRegionDisplayConfigFormValues,
    draft: IRegionDisplayFlag,
    lastCustomColor: string,
  ): { flag: IRegionDisplayFlag; lastCustomColor: string } {
    const flag: IRegionDisplayFlag = { profile: values.profile ?? draft.profile ?? "" };
    const pattern = values.pattern ?? draft.pattern;
    if (RegionDisplayProfiles.isPattern(pattern)) flag.pattern = pattern;
    const dashed = values.dashed ?? draft.dashed;
    if (dashed === "dashed" || dashed === "continuous") flag.dashed = dashed;
    const border = values.border ?? draft.border;
    if (border === "border" || border === "none") flag.border = border;
    for (const { key } of REGION_DISPLAY_FIELDS) {
      // a blank number input reads as null, which clears the override; only a field the form
      // does not show at all falls back to the draft
      const raw = key in values ? values[key] : draft[key];
      if (raw === "" || raw === null || raw === undefined) continue;
      const value = RegionDisplayProfiles.clamp(key, raw, NaN);
      if (Number.isFinite(value)) flag[key] = value;
    }
    const { color, lastCustom } = resolveColor({
      picked: values.color,
      current: draft.color,
      lastCustom: lastCustomColor,
      inherit: values.useProfileColor,
    });
    if (color !== null) flag.color = color;
    return { flag, lastCustomColor: lastCustom };
  }

  /**
   * The region document update that turns the stored flag into the edited one: each key it
   * now carries is set and each it dropped is deleted, so a cleared override does not linger
   * in the merge. Without a profile the whole flag goes.
   */
  static updateData(
    previous: IRegionDisplayFlag | null | undefined,
    next: IRegionDisplayFlag,
  ): Record<string, unknown> {
    if (!next.profile) return { [REGION_DISPLAY_FLAG_PATH]: _del };
    const update: Record<string, unknown> = {};
    for (const key of REGION_DISPLAY_FLAG_KEYS) {
      const value = next[key];
      if (value !== undefined && value !== "" && value !== null) {
        update[`${REGION_DISPLAY_FLAG_PATH}.${key}`] = value;
      } else if (previous && previous[key] !== undefined) {
        update[`${REGION_DISPLAY_FLAG_PATH}.${key}`] = _del;
      }
    }
    return update;
  }

  override async _prepareContext(options: any) {
    const context = (await super._prepareContext({ ...options, noCacheLoad: true })) as any;
    const draft = this.draft;
    const style = RegionDisplayProfiles.resolve(draft);
    const previewColor = this.target.color;
    const profileDefault = RegionDisplayProfiles.localize("profileDefault");
    context.profileOptions = profileOptions(RegionDisplayProfiles.localize("noProfile")).map((option) => ({
      ...option,
      selected: option.value === (draft.profile ?? ""),
    }));
    context.hasProfile = Boolean(draft.profile);
    const ownSpacing = RegionDisplayProfiles.clamp("spacing", draft.spacing, NaN);
    context.perSquare = Number.isFinite(ownSpacing) ? (RegionDisplayProfiles.countForSpacing(ownSpacing) ?? "") : "";
    context.perSquarePlaceholder = style ? (RegionDisplayProfiles.countForSpacing(style.spacing) ?? "profile") : "profile";
    context.patternOptions = [
      { value: "", label: profileDefault, selected: !RegionDisplayProfiles.isPattern(draft.pattern) },
      ...REGION_DISPLAY_PATTERNS.map((value) => ({
        value,
        label: RegionDisplayProfiles.patternLabel(value),
        selected: value === draft.pattern,
      })),
    ];
    const dashed = RegionDisplayProfiles.dashedValue(draft.dashed);
    context.dashedOptions = [
      { value: "", label: profileDefault, selected: dashed === null },
      { value: "dashed", label: RegionDisplayProfiles.localize("dashed"), selected: dashed === true },
      { value: "continuous", label: RegionDisplayProfiles.localize("continuous"), selected: dashed === false },
    ];
    const border = RegionDisplayProfiles.borderValue(draft.border);
    context.borderOptions = [
      { value: "", label: profileDefault, selected: border === null },
      { value: "border", label: RegionDisplayProfiles.localize("border"), selected: border === true },
      { value: "none", label: RegionDisplayProfiles.localize("noBorder"), selected: border === false },
    ];
    // which controls apply follows the resolved style, so an inherited border still offers its width
    context.showDashed = style ? RegionDisplayProfiles.toggleApplies("dashed", style.pattern) : false;
    context.showBorder = style ? RegionDisplayProfiles.toggleApplies("border", style.pattern) : false;
    context.showPerSquare = style ? RegionDisplayProfiles.fieldApplies("spacing", style) : false;
    context.numericFields = REGION_DISPLAY_FIELDS
      .filter(({ key }) => style !== null && RegionDisplayProfiles.fieldApplies(key, style))
      .map(({ key }) => {
        const value = RegionDisplayProfiles.clamp(key, draft[key], NaN);
        return {
          key,
          label: RegionDisplayProfiles.fieldLabel(key),
          hint: RegionDisplayProfiles.fieldHint(key, style?.pattern),
          value: Number.isFinite(value) ? value : "",
          limits: REGION_DISPLAY_LIMITS[key],
          // the profile's value shows as the placeholder so a blank field reads as what it inherits
          placeholder: style ? String(style[key]) : "profile",
        };
      });
    const customColor = typeof draft.color === "string" && draft.color.trim() ? draft.color.trim() : null;
    context.useProfileColor = customColor === null;
    context.colorValue = customColor ?? this.lastCustomColor;
    context.summary = describeDisplayFlag(draft);
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
    bindLiveInput(this.element as HTMLElement | null, () => this.#syncDraftFromForm());
  }

  override _onChangeForm(formConfig: any, event: any) {
    super._onChangeForm(formConfig, event);
    this.#syncDraftFromForm();
    const target = event?.target as HTMLElement | null;
    const name = target?.getAttribute("name") ?? "";
    // a count per square sets the spacing override rather than being stored itself; blank clears it
    if (name === "perSquare") {
      const spacing = RegionDisplayProfiles.spacingForCount((target as HTMLInputElement).value);
      if (spacing !== null) this.draft.spacing = spacing;
      else delete this.draft.spacing;
      this.render();
      return;
    }
    // these choose which controls apply; the colour box changes whether the picker shows
    if (["profile", "pattern", "dashed", "border", "useProfileColor"].includes(name)) this.render();
  }

  #syncDraftFromForm(): void {
    const result = DDBRegionDisplayConfig.flagFromForm(
      readForm<IRegionDisplayConfigFormValues>(this.element as HTMLElement | null),
      this.draft,
      this.lastCustomColor,
    );
    this.draft = result.flag;
    this.lastCustomColor = result.lastCustomColor;
    const element = this.element as HTMLElement | null;
    if (!element) return;
    const style = RegionDisplayProfiles.resolve(this.draft);
    for (const preview of element.querySelectorAll<HTMLElement>(".ddbi-display-region-preview")) {
      preview.setAttribute(
        "style",
        style ? previewCss(style, this.target.color, Number(preview.dataset.grid) || PREVIEW_GRID) : "",
      );
    }
    const summary = element.querySelector<HTMLElement>(".ddbi-display-region-summary-text");
    if (summary) summary.textContent = describeDisplayFlag(this.draft);
  }

  /** Store the draft, less any override a control hidden by the chosen pattern left behind. */
  static async saveDisplay(this: DDBRegionDisplayConfig): Promise<void> {
    this.#syncDraftFromForm();
    await this.#write(RegionDisplayProfiles.applicable(this.draft));
  }

  static async clearDisplay(this: DDBRegionDisplayConfig): Promise<void> {
    this.draft = {};
    await this.#write(this.draft);
  }

  static async closeApp(this: DDBRegionDisplayConfig): Promise<void> {
    await this.close();
  }

  async #write(flag: IRegionDisplayFlag): Promise<void> {
    try {
      await this.target.write(flag);
      await this.close();
    } catch (error) {
      logger.error("Unable to update the region display", { error, flag, target: this.target.key });
      ui.notifications.error("Unable to update the region display; see the console.");
    }
  }

  override async close(options?: any) {
    DDBRegionDisplayConfig.#instances.delete(this.target.key);
    return super.close(options);
  }
}
