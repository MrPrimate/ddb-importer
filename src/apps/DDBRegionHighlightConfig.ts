import DDBAppV2 from "./DDBAppV2";
import {
  REGION_HIGHLIGHT_LIMITS,
  REGION_HIGHLIGHT_PATTERN_LABELS,
  REGION_HIGHLIGHT_PATTERNS,
} from "../config/regionHighlightProfiles";
import { highlightFlag } from "../hooks/canvas/regionHighlight";
import { profileOptions } from "../hooks/canvas/regionHighlightPicker";
import { previewCss } from "../hooks/canvas/regionHighlightPreview";
import logger from "../lib/Logger";
import RegionHighlightProfiles from "../lib/RegionHighlightProfiles";

/** Where a region's highlight choice lives on its document. */
export const REGION_HIGHLIGHT_FLAG_PATH = "flags.ddbimporter.highlight";

/** The colour the previews use when neither the flag nor the profile names one. */
const FALLBACK_COLOR = "#ff6400";

/** Pixel size of one grid square in the two previews: the strip and the single enlarged square. */
const PREVIEW_GRID = 50;
const PREVIEW_GRID_LARGE = 150;

type TNumericKey = keyof typeof REGION_HIGHLIGHT_LIMITS;

/** The numeric overrides in the order the form shows them; blank means "the profile's value". */
export const REGION_HIGHLIGHT_NUMERIC_OVERRIDES: { key: TNumericKey; label: string; hint: string }[] = [
  { key: "opacity", label: "Fill Opacity", hint: "0 to 1." },
  { key: "gapOpacity", label: "Gap Opacity", hint: "Relative to fill opacity; zero makes pattern gaps transparent." },
  { key: "borderOpacity", label: "Border Opacity", hint: "Independent of fill opacity." },
  { key: "spacing", label: "Spacing", hint: "Distance between lines or symbols, in grid squares." },
  { key: "thickness", label: "Thickness", hint: "Line width or symbol diameter as a share of the spacing, 0 to 1." },
  { key: "edgeWidth", label: "Edge Width", hint: "Band width of the Edge Band pattern, in grid squares." },
  { key: "dashLength", label: "Dash Length", hint: "Length of each dash and of the gap after it, in grid squares." },
  { key: "angle", label: "Line Angle", hint: "Direction the lines face, in degrees." },
  { key: "borderWidth", label: "Border Width", hint: "Band width inside the edge, in grid squares." },
];

/** Every key a highlight flag can carry, used to diff an edit against the stored flag. */
const FLAG_KEYS: (keyof IRegionHighlightFlag)[] = [
  "profile",
  "pattern",
  "dashed",
  "border",
  "color",
  ...REGION_HIGHLIGHT_NUMERIC_OVERRIDES.map((field) => field.key),
];

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

/**
 * The words the Region config's summary box uses for a flag: the profile name and each
 * override that departs from it, or the Foundry default when there is no profile.
 */
export function describeHighlightFlag(flag: IRegionHighlightFlag | null | undefined): string {
  const profile = RegionHighlightProfiles.get(flag?.profile);
  if (!flag?.profile) return "None (Foundry default)";
  if (!profile) return `Unknown profile "${flag.profile}" (Foundry default)`;
  const parts: string[] = [];
  if (RegionHighlightProfiles.isPattern(flag.pattern))
    parts.push(REGION_HIGHLIGHT_PATTERN_LABELS[flag.pattern].toLowerCase());
  const dashed = RegionHighlightProfiles.dashedValue(flag.dashed);
  if (dashed !== null) parts.push(dashed ? "dashed" : "continuous");
  const border = RegionHighlightProfiles.borderValue(flag.border);
  if (border !== null) parts.push(border ? "border" : "no border");
  for (const { key, label } of REGION_HIGHLIGHT_NUMERIC_OVERRIDES) {
    const value = RegionHighlightProfiles.clamp(key, flag[key], NaN);
    if (Number.isFinite(value)) parts.push(`${label.toLowerCase()} ${value}${key === "angle" ? "°" : ""}`);
  }
  if (typeof flag.color === "string" && flag.color.trim()) parts.push(`colour ${flag.color.trim()}`);
  return parts.length ? `${profile.name}, ${parts.join(", ")}` : profile.name;
}

/**
 * Edit one region's highlight: the profile it uses and any overrides. Opened from the
 * "Configure" button in the Region config's appearance tab. Saving writes the document's
 * `flags.ddbimporter.highlight` directly, as Foundry's own region behavior sheets do, so the
 * Region config re-renders its summary while it stays open.
 */
export default class DDBRegionHighlightConfig extends DDBAppV2 {
  /** One window per region, keyed by document uuid. */
  static #instances = new Map<string, DDBRegionHighlightConfig>();

  region: IRegionLike;

  /** The flag as the form currently describes it. */
  draft: IRegionHighlightFlag;

  /** The last custom colour seen, so unticking "use the profile's colour" brings it back. */
  lastCustomColor: string = FALLBACK_COLOR;

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

  constructor(region: IRegionLike) {
    super();
    this.region = region;
    this.draft = { ...(highlightFlag(region as RegionDocument.Implementation) ?? {}) };
    if (typeof this.draft.color === "string" && this.draft.color) this.lastCustomColor = this.draft.color;
  }

  /** Show the editor for a region, reusing its open window. */
  static open(region: IRegionLike): DDBRegionHighlightConfig {
    const key = region.uuid ?? String(region.id);
    let app = DDBRegionHighlightConfig.#instances.get(key);
    if (!app) {
      app = new DDBRegionHighlightConfig(region);
      DDBRegionHighlightConfig.#instances.set(key, app);
    }
    app.render({ force: true });
    return app;
  }

  override get title(): string {
    const name = this.region.name ? `: ${this.region.name}` : "";
    return `Region Texture${name}`;
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
   * The document update that turns the stored flag into the edited one: each key it now
   * carries is set and each it dropped is deleted, so a cleared override does not linger in
   * the merge. Without a profile the whole flag goes.
   */
  static updateData(
    previous: IRegionHighlightFlag | null | undefined,
    next: IRegionHighlightFlag,
  ): Record<string, unknown> {
    if (!next.profile) return { "flags.ddbimporter.-=highlight": null };
    const update: Record<string, unknown> = {};
    for (const key of FLAG_KEYS) {
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
    const regionColor = typeof this.region.color === "string" && this.region.color ? this.region.color : FALLBACK_COLOR;
    const style = RegionHighlightProfiles.resolve(draft);
    const previewColor = String(this.region.color ?? FALLBACK_COLOR);
    context.regionName = this.region.name ?? "";
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
    context.colorValue = customColor ?? this.lastCustomColor ?? regionColor;
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
    const previewColor = String(this.region.color ?? FALLBACK_COLOR);
    for (const preview of element.querySelectorAll<HTMLElement>(".ddbi-highlight-preview")) {
      preview.setAttribute(
        "style",
        style ? previewCss(style, previewColor, Number(preview.dataset.grid) || PREVIEW_GRID) : "",
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
    const previous = highlightFlag(this.region as RegionDocument.Implementation);
    const update = DDBRegionHighlightConfig.updateData(previous, flag);
    try {
      await this.region.update?.(update);
      await this.close();
    } catch (error) {
      logger.error("Unable to update the region highlight", { error, update });
      ui.notifications.error("Unable to update the region highlight; see the console.");
    }
  }

  override async close(options?: any) {
    DDBRegionHighlightConfig.#instances.delete(this.region.uuid ?? String(this.region.id));
    return super.close(options);
  }
}
