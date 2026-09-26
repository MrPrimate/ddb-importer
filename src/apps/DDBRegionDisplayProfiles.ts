import DDBAppV2 from "./DDBAppV2";
import {
  REGION_DISPLAY_DEFAULTS,
  REGION_DISPLAY_FALLBACK_COLOR,
  REGION_DISPLAY_FIELDS,
  REGION_DISPLAY_LIMITS,
  REGION_DISPLAY_PATTERNS,
  REGION_DISPLAY_PROFILES_CHANGED,
} from "../config/regionDisplayProfiles";
import { disposeImagePreviews, imagePreviewData, paintImagePreviews } from "../hooks/canvas/regionDisplayImagePreview";
import { previewCss } from "../hooks/canvas/regionDisplayPreview";
import { canEditProfiles, profileGroup, refreshProfilePickers } from "../hooks/canvas/regionDisplayPicker";
import logger from "../lib/Logger";
import RegionDisplayProfiles from "../lib/RegionDisplayProfiles";
import { bindLiveInput, PREVIEW_GRID, PREVIEW_GRID_LARGE, readForm, resolveColor } from "./lib/regionDisplayForm";
import { bindImagePicker, imageFormContext, loadImageFormTemplate } from "./lib/regionDisplayImageForm";

/** The colour the swatches use when a profile takes the region's own colour. */
const SWATCH_COLOR = REGION_DISPLAY_FALLBACK_COLOR;

interface IProfileFormValues {
  name?: string;
  pattern?: string;
  textureSrc?: string;
  textureColorMode?: IRegionDisplayProfile["textureColorMode"] | "";
  textureAnchor?: IRegionDisplayProfile["textureAnchor"] | "";
  textureFit?: IRegionDisplayProfile["textureFit"] | "";
  opacity?: number | string;
  gapOpacity?: number | string;
  borderOpacity?: number | string;
  matchFillOpacity?: boolean;
  spacing?: number | string;
  thickness?: number | string;
  edgeWidth?: number | string;
  dashed?: boolean;
  dashLength?: number | string;
  angle?: number | string;
  crossRotation?: number | string;
  crossLength?: number | string;
  waveAmplitude?: number | string;
  waveLength?: number | string;
  offset?: number | string;
  /** Transient: symbols per grid square, which sets the spacing; never stored. */
  perSquare?: number | string;
  border?: boolean;
  borderWidth?: number | string;
  color?: string | null;
  useRegionColor?: boolean;
}

/**
 * Build and tune region display profiles. Opened from the gear beside any profile picker,
 * from module settings (through DDBRegionDisplayProfilesMenu), or
 * `DDBImporter.apps.DDBRegionDisplayProfiles.open()`. The profiles are a world setting, so
 * only a user who may change world settings can open it.
 */
export default class DDBRegionDisplayProfiles extends DDBAppV2 {
  static #instance: DDBRegionDisplayProfiles | null = null;

  /** The profile being edited; null until one is chosen or created. */
  draft: IRegionDisplayProfile | null = null;

  /** The stored id the draft came from; null for a new, unsaved profile. */
  selectedId: string | null = null;

  /**
   * The last custom colour seen, so unticking "use the region's colour" brings it back. A
   * null draft colour means "the region's own", so the checkbox cannot be derived from a
   * colour that has not been chosen yet.
   */
  lastCustomColor: string = SWATCH_COLOR;

  static override DEFAULT_OPTIONS = {
    id: "ddb-region-display-profiles",
    classes: ["standard-form", "dnd5e2", "ddbi-display-profiles"],
    window: {
      title: "ddb-importer.behaviors.display.profiles.title",
      icon: "fas fa-draw-polygon",
      resizable: true,
    },
    tag: "form",
    // `this`, not the class name: with `#private` members present, tsc compiles a class-name
    // reference in a static initializer to an alias that is still undefined here. Only the
    // release (webpack/tsc) build breaks; the esbuild dev build hides it.
    actions: {
      selectProfile: this.selectProfile,
      createProfile: this.createProfile,
      duplicateProfile: this.duplicateProfile,
      deleteProfile: this.deleteProfile,
      resetProfile: this.resetProfile,
      saveProfile: this.saveProfile,
      closeApp: this.closeApp,
    },
    position: { width: 760, height: "auto" as const },
  };

  static override PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/region-display/profiles.hbs",
      scrollable: [".ddbi-display-region-list ul", ".ddbi-display-region-editor"],
    },
  };

  /** A new editor starts on the first profile rather than an empty pane. */
  constructor(options: Record<string, any> = {}) {
    super(options);
    const first = RegionDisplayProfiles.all()[0];
    if (first) this.load(first);
  }

  /**
   * Show the one editor window, focused on a profile when one is named. An already open
   * window keeps its draft unless another profile is asked for. Null, with a warning, for a
   * user who could not save.
   */
  static open({ profileId = null }: { profileId?: string | null } = {}): DDBRegionDisplayProfiles | null {
    if (!canEditProfiles()) {
      ui.notifications.warn(RegionDisplayProfiles.localize("profilesPermission"));
      return null;
    }
    // a window built directly (`new ...().render()`) is adopted rather than duplicated
    const live = foundry.applications.instances.get(DDBRegionDisplayProfiles.DEFAULT_OPTIONS.id);
    const app = DDBRegionDisplayProfiles.#instance
      ?? (live instanceof DDBRegionDisplayProfiles ? live : new DDBRegionDisplayProfiles());
    DDBRegionDisplayProfiles.#instance = app;
    const profile = RegionDisplayProfiles.get(profileId) ?? (app.draft ? null : RegionDisplayProfiles.all()[0]);
    if (profile) app.load(profile);
    app.render({ force: true });
    return app;
  }

  /** The last gate for every way in, including a directly built window: saving needs the world setting. */
  protected override _canRender(_options: unknown): boolean | void {
    if (!canEditProfiles()) throw new Error(RegionDisplayProfiles.localize("profilesPermission"));
  }

  _getTabs(): IDDBTabs {
    return {};
  }

  load(profile: IRegionDisplayProfile): void {
    this.draft = { ...profile };
    this.selectedId = profile.id;
    if (profile.color) this.lastCustomColor = profile.color;
  }

  /**
   * The spacing slider's step: the coarse one, or a fine one for a count per square. The
   * picker rounds its value to its step, so a third (0.3333) needs the fine step to survive
   * the next form read; with it, every read reports the value the slider shows.
   */
  static spacingStep(spacing: number): number {
    const step = REGION_DISPLAY_LIMITS.spacing.step;
    const onGrid = Math.abs(spacing / step - Math.round(spacing / step)) < 1e-6;
    return onGrid ? step : 0.0001;
  }

  /**
   * Fold the form's values into a draft. Range pickers report numbers and plain inputs
   * strings; normalize clamps either. The colour picker only exists while the region-colour
   * box is unticked, so unticking it falls back to the last custom colour.
   */
  static draftFromForm(
    values: IProfileFormValues,
    draft: IRegionDisplayProfile,
    lastCustomColor: string,
  ): { draft: IRegionDisplayProfile; lastCustomColor: string } {
    const number = (value: number | string | undefined, fallback: number): number =>
      value === undefined || value === "" ? fallback : Number(value);
    const { color, lastCustom } = resolveColor({
      picked: values.color,
      current: draft.color,
      lastCustom: lastCustomColor,
      inherit: values.useRegionColor,
    });
    const next = RegionDisplayProfiles.normalize(
      {
        ...draft,
        name: values.name ?? draft.name,
        textureSrc: values.textureSrc ?? draft.textureSrc,
        textureColorMode: values.textureColorMode || draft.textureColorMode,
        textureAnchor: values.textureAnchor || draft.textureAnchor,
        textureFit: values.textureFit || draft.textureFit,
        pattern: (values.pattern as TRegionDisplayPattern | undefined) ?? draft.pattern,
        opacity: number(values.opacity, draft.opacity),
        gapOpacity: number(values.gapOpacity, draft.gapOpacity),
        borderOpacity:
          values.matchFillOpacity === true
            ? null
            : values.matchFillOpacity === false
              ? number(values.borderOpacity, draft.borderOpacity ?? number(values.opacity, draft.opacity))
              : draft.borderOpacity,
        spacing: number(values.spacing, draft.spacing),
        thickness: number(values.thickness, draft.thickness),
        edgeWidth: number(values.edgeWidth, draft.edgeWidth),
        dashed: typeof values.dashed === "boolean" ? values.dashed : draft.dashed,
        dashLength: number(values.dashLength, draft.dashLength),
        angle: number(values.angle, draft.angle),
        crossRotation: number(values.crossRotation, draft.crossRotation),
        crossLength: number(values.crossLength, draft.crossLength),
        waveAmplitude: number(values.waveAmplitude, draft.waveAmplitude),
        waveLength: number(values.waveLength, draft.waveLength),
        offset: number(values.offset, draft.offset),
        border: typeof values.border === "boolean" ? values.border : draft.border,
        borderWidth: number(values.borderWidth, draft.borderWidth),
        color,
      },
      draft,
    );
    return { draft: next, lastCustomColor: lastCustom };
  }

  override async _prepareContext(options: any) {
    await loadImageFormTemplate();
    const context = (await super._prepareContext({ ...options, noCacheLoad: true })) as any;
    const draft = this.draft;
    // all() keeps each group together, so a heading goes above the first profile of each group
    const profiles = RegionDisplayProfiles.all();
    const groups = profiles.map((profile) => profileGroup(profile.id));
    context.profiles = profiles.map((profile, index) => ({
      groupHeading: groups[index] === groups[index - 1] ? "" : groups[index],
      id: profile.id,
      name: profile.name,
      builtin: profile.builtin === true,
      overridden: RegionDisplayProfiles.isOverriddenBuiltin(profile.id),
      selected: profile.id === this.selectedId,
      swatchStyle: previewCss(profile, SWATCH_COLOR, 16),
      swatchImage: imagePreviewData(profile, SWATCH_COLOR, 16),
    }));
    if (draft) {
      const stored = this.selectedId ? RegionDisplayProfiles.get(this.selectedId) : null;
      Object.assign(context, imageFormContext(draft, draft, false));
      context.draft = draft;
      context.isNew = !stored;
      context.isBuiltin = RegionDisplayProfiles.isBuiltinId(draft.id);
      context.canDelete = Boolean(stored) && !context.isBuiltin;
      context.canReset = RegionDisplayProfiles.isOverriddenBuiltin(draft.id);
      context.useRegionColor = draft.color === null;
      context.colorValue = draft.color ?? SWATCH_COLOR;
      context.previewGrid = PREVIEW_GRID;
      context.previewGridLarge = PREVIEW_GRID_LARGE;
      context.previewStyle = previewCss(draft, SWATCH_COLOR, PREVIEW_GRID);
      context.previewImage = imagePreviewData(draft, SWATCH_COLOR, PREVIEW_GRID);
      context.previewImageLarge = imagePreviewData(draft, SWATCH_COLOR, PREVIEW_GRID_LARGE);
      context.previewStyleLarge = previewCss(draft, SWATCH_COLOR, PREVIEW_GRID_LARGE);
      context.patternOptions = REGION_DISPLAY_PATTERNS.map((value) => ({
        value,
        label: RegionDisplayProfiles.patternLabel(value),
        selected: value === draft.pattern,
      }));
      context.limits = REGION_DISPLAY_LIMITS;
      context.perSquare = RegionDisplayProfiles.countForSpacing(draft.spacing) ?? "";
      context.spacingStep = DDBRegionDisplayProfiles.spacingStep(draft.spacing);
      // which controls show, and their hints, come from the shared field table
      context.fields = Object.fromEntries(
        REGION_DISPLAY_FIELDS.map(({ key }) => [
          key,
          {
            visible: RegionDisplayProfiles.fieldApplies(key, draft),
            label: RegionDisplayProfiles.fieldLabel(key),
            hint: RegionDisplayProfiles.fieldHint(key, draft.pattern),
          },
        ]),
      );
      context.showDashed = RegionDisplayProfiles.toggleApplies("dashed", draft.pattern);
      context.showBorder = RegionDisplayProfiles.toggleApplies("border", draft.pattern);
      context.matchFillOpacity = draft.borderOpacity === null;
      context.borderOpacityValue = draft.borderOpacity ?? draft.opacity;
    }
    return context;
  }

  override async _onRender(context: any, options: any) {
    await super._onRender(context, options);
    bindLiveInput(this.element as HTMLElement | null, () => this.#syncDraftFromForm());
    bindImagePicker(this.element);
    paintImagePreviews(this.element);
    this.element.querySelector<HTMLElement>(".ddbi-display-region-entry.active")?.scrollIntoView({ block: "nearest" });
  }

  override _onChangeForm(formConfig: any, event: any) {
    super._onChangeForm(formConfig, event);
    this.#syncDraftFromForm();
    const target = event?.target as HTMLElement | null;
    const name = target?.getAttribute("name") ?? "";
    // a count per square sets the spacing slider rather than being stored itself
    if (name === "perSquare" && this.draft) {
      const spacing = RegionDisplayProfiles.spacingForCount((target as HTMLInputElement).value);
      if (spacing !== null) this.draft.spacing = spacing;
      this.render();
      return;
    }
    // the pattern, dash and colour mode change which fields are shown
    if (["pattern", "useRegionColor", "dashed", "border", "matchFillOpacity"].includes(name)) this.render();
  }

  #syncDraftFromForm(): void {
    if (!this.draft) return;
    const result = DDBRegionDisplayProfiles.draftFromForm(
      readForm<IProfileFormValues>(this.element as HTMLElement | null),
      this.draft,
      this.lastCustomColor,
    );
    this.draft = result.draft;
    this.lastCustomColor = result.lastCustomColor;
    for (const preview of this.element?.querySelectorAll<HTMLElement>(".ddbi-display-region-preview") ?? []) {
      preview.setAttribute("style", previewCss(this.draft, SWATCH_COLOR, Number(preview.dataset.grid) || PREVIEW_GRID));
      preview.dataset.imagePreview = imagePreviewData(
        this.draft,
        SWATCH_COLOR,
        Number(preview.dataset.grid) || PREVIEW_GRID,
      );
    }
    paintImagePreviews(this.element);
  }

  static selectProfile(this: DDBRegionDisplayProfiles, _event: Event, target: HTMLElement): void {
    const id = target.closest<HTMLElement>("[data-profile-id]")?.dataset.profileId;
    const profile = RegionDisplayProfiles.get(id);
    if (!profile) return;
    this.load(profile);
    this.render();
  }

  /** A new profile starts from Foundry's own look. */
  static createProfile(this: DDBRegionDisplayProfiles): void {
    this.draft = RegionDisplayProfiles.normalize({
      ...REGION_DISPLAY_DEFAULTS,
      name: RegionDisplayProfiles.defaultName,
      id: RegionDisplayProfiles.newId(),
    });
    this.selectedId = null;
    this.render();
  }

  static duplicateProfile(this: DDBRegionDisplayProfiles): void {
    if (!this.draft) return;
    this.#syncDraftFromForm();
    const name = RegionDisplayProfiles.format("copyName", { name: this.draft.name });
    this.draft = RegionDisplayProfiles.normalize(
      { ...this.draft, name, id: RegionDisplayProfiles.newId() },
      this.draft,
    );
    this.selectedId = null;
    this.render();
  }

  static async deleteProfile(this: DDBRegionDisplayProfiles): Promise<void> {
    const id = this.selectedId;
    if (!id || RegionDisplayProfiles.isBuiltinId(id)) return;
    const proceed = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: { title: RegionDisplayProfiles.localize("profiles.deleteTitle") },
      content: `<p>${RegionDisplayProfiles.format("profiles.deleteContent", { name: foundry.utils.escapeHTML(this.draft?.name ?? id) })}</p>`,
    });
    if (!proceed) return;
    await RegionDisplayProfiles.remove(id);
    this.#afterStoreChange(RegionDisplayProfiles.all()[0] ?? null);
  }

  static async resetProfile(this: DDBRegionDisplayProfiles): Promise<void> {
    const id = this.selectedId;
    if (!id || !RegionDisplayProfiles.isOverriddenBuiltin(id)) return;
    await RegionDisplayProfiles.remove(id);
    this.#afterStoreChange(RegionDisplayProfiles.get(id));
  }

  static async saveProfile(this: DDBRegionDisplayProfiles): Promise<void> {
    if (!this.draft) return;
    this.#syncDraftFromForm();
    try {
      const saved = await RegionDisplayProfiles.save(this.draft);
      ui.notifications.info(RegionDisplayProfiles.format("profiles.saved", { name: saved.name }));
      this.#afterStoreChange(saved);
    } catch (error) {
      logger.error("Unable to save region display profile", { error });
      ui.notifications.error(RegionDisplayProfiles.localize("profiles.saveError"));
    }
  }

  static async closeApp(this: DDBRegionDisplayProfiles): Promise<void> {
    await this.close();
  }

  #afterStoreChange(profile: IRegionDisplayProfile | null): void {
    if (profile) this.load(profile);
    else {
      this.draft = null;
      this.selectedId = null;
    }
    this.render();
  }

  override async close(options?: any) {
    disposeImagePreviews(this.element);
    if (DDBRegionDisplayProfiles.#instance === this) DDBRegionDisplayProfiles.#instance = null;
    return super.close(options);
  }

  /**
   * Keep every open activity sheet's picker current: dnd5e renders behavior fields from
   * the data model, so a saved profile would otherwise only appear after the sheet reopens.
   */
  static registerPickerRefresh(): void {
    Hooks.on<typeof REGION_DISPLAY_PROFILES_CHANGED>(REGION_DISPLAY_PROFILES_CHANGED, () => {
      const blank = RegionDisplayProfiles.localize("noProfile");
      for (const app of foundry.applications.instances.values()) {
        const element = (app as { element?: HTMLElement }).element;
        if (element && !(app instanceof DDBRegionDisplayProfiles)) refreshProfilePickers(element, blank);
      }
    });
  }
}

/**
 * The settings menu entry. Foundry builds a new instance of a menu's class, with no options,
 * on every click and renders it; pointing the menu at the editor itself would open a second,
 * empty window under the editor's fixed id. This stand-in never renders and hands over to
 * the one editor instead.
 */
export class DDBRegionDisplayProfilesMenu extends foundry.applications.api.ApplicationV2 {
  override async render(): Promise<this> {
    DDBRegionDisplayProfiles.open();
    return this;
  }
}
