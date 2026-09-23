import DDBAppV2 from "./DDBAppV2";
import { REGION_HIGHLIGHT_LIMITS, REGION_HIGHLIGHT_PATTERN_LABELS, REGION_HIGHLIGHT_PATTERNS } from "../config/regionHighlightProfiles";
import { previewCss } from "../hooks/canvas/regionHighlightPreview";
import { refreshProfilePickers } from "../hooks/canvas/regionHighlightPicker";
import logger from "../lib/Logger";
import RegionHighlightProfiles, { REGION_HIGHLIGHT_PROFILES_CHANGED } from "../lib/RegionHighlightProfiles";

/** The colour the swatches use when a profile takes the region's own colour. */
const SWATCH_COLOR = "#ff6400";

/** Pixel size of one grid square in the two previews: the strip and the single enlarged square. */
const PREVIEW_GRID = 50;
const PREVIEW_GRID_LARGE = 150;

interface IProfileFormValues {
  name?: string;
  pattern?: string;
  opacity?: number | string;
  spacing?: number | string;
  thickness?: number | string;
  edgeWidth?: number | string;
  dashed?: boolean;
  dashLength?: number | string;
  angle?: number | string;
  border?: boolean;
  borderWidth?: number | string;
  color?: string | null;
  useRegionColor?: boolean;
}

/**
 * Build and tune region highlight profiles. Opened from the gear beside any profile picker,
 * from module settings, or `DDBImporter.apps.DDBRegionHighlightProfiles.open()`.
 */
export default class DDBRegionHighlightProfiles extends DDBAppV2 {

  static #instance: DDBRegionHighlightProfiles | null = null;

  /** The profile being edited; null until one is chosen or created. */
  draft: IRegionHighlightProfile | null = null;

  /** The stored id the draft came from; null for a new, unsaved profile. */
  selectedId: string | null = null;

  /**
   * The last custom colour seen, so unticking "use the region's colour" brings it back. A
   * null draft colour means "the region's own", so the checkbox cannot be derived from a
   * colour that has not been chosen yet.
   */
  lastCustomColor: string = SWATCH_COLOR;

  static override DEFAULT_OPTIONS = {
    id: "ddb-region-highlight-profiles",
    classes: ["standard-form", "dnd5e2", "ddbi-highlight-profiles"],
    window: {
      title: "Region Highlight Profiles",
      icon: "fas fa-draw-polygon",
      resizable: true,
    },
    tag: "form",
    actions: {
      selectProfile: DDBRegionHighlightProfiles.selectProfile,
      createProfile: DDBRegionHighlightProfiles.createProfile,
      duplicateProfile: DDBRegionHighlightProfiles.duplicateProfile,
      deleteProfile: DDBRegionHighlightProfiles.deleteProfile,
      resetProfile: DDBRegionHighlightProfiles.resetProfile,
      saveProfile: DDBRegionHighlightProfiles.saveProfile,
      closeApp: DDBRegionHighlightProfiles.closeApp,
    },
    position: { width: 760, height: "auto" as const },
  };

  static override PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/region-highlight/profiles.hbs",
    },
  };

  /** Show the editor, focused on a profile when one is named. */
  static open({ profileId = null }: { profileId?: string | null } = {}): DDBRegionHighlightProfiles {
    const app = DDBRegionHighlightProfiles.#instance ?? new DDBRegionHighlightProfiles();
    DDBRegionHighlightProfiles.#instance = app;
    const profile = RegionHighlightProfiles.get(profileId) ?? (app.draft ? null : RegionHighlightProfiles.all()[0]);
    if (profile) app.load(profile);
    app.render({ force: true });
    return app;
  }

  _getTabs(): IDDBTabs {
    return {};
  }

  load(profile: IRegionHighlightProfile): void {
    this.draft = { ...profile };
    this.selectedId = profile.id;
    if (profile.color) this.lastCustomColor = profile.color;
  }

  /**
   * Fold the form's values into a draft. Range pickers report numbers and plain inputs
   * strings; normalize clamps either. The colour picker only exists while the region-colour
   * box is unticked, so unticking it falls back to the last custom colour.
   */
  static draftFromForm(
    values: IProfileFormValues,
    draft: IRegionHighlightProfile,
    lastCustomColor: string,
  ): { draft: IRegionHighlightProfile; lastCustomColor: string } {
    const number = (value: number | string | undefined, fallback: number): number =>
      value === undefined || value === "" ? fallback : Number(value);
    const picked = typeof values.color === "string" && values.color.trim() ? values.color.trim() : null;
    const remembered = picked ?? lastCustomColor;
    const color = values.useRegionColor === true ? null : remembered;
    const next = RegionHighlightProfiles.normalize({
      ...draft,
      name: values.name ?? draft.name,
      pattern: (values.pattern as TRegionHighlightPattern | undefined) ?? draft.pattern,
      opacity: number(values.opacity, draft.opacity),
      spacing: number(values.spacing, draft.spacing),
      thickness: number(values.thickness, draft.thickness),
      edgeWidth: number(values.edgeWidth, draft.edgeWidth),
      dashed: typeof values.dashed === "boolean" ? values.dashed : draft.dashed,
      dashLength: number(values.dashLength, draft.dashLength),
      angle: number(values.angle, draft.angle),
      border: typeof values.border === "boolean" ? values.border : draft.border,
      borderWidth: number(values.borderWidth, draft.borderWidth),
      color,
    }, draft);
    return { draft: next, lastCustomColor: remembered };
  }

  override async _prepareContext(options: any) {
    const context = await super._prepareContext({ ...options, noCacheLoad: true }) as any;
    const draft = this.draft;
    context.profiles = RegionHighlightProfiles.all().map((profile) => ({
      id: profile.id,
      name: profile.name,
      builtin: profile.builtin === true,
      overridden: RegionHighlightProfiles.isOverriddenBuiltin(profile.id),
      selected: profile.id === this.selectedId,
      swatchStyle: previewCss(profile, SWATCH_COLOR, 16),
    }));
    if (draft) {
      const stored = this.selectedId ? RegionHighlightProfiles.get(this.selectedId) : null;
      context.draft = draft;
      context.isNew = !stored;
      context.isBuiltin = RegionHighlightProfiles.isBuiltinId(draft.id);
      context.canDelete = Boolean(stored) && !context.isBuiltin;
      context.canReset = RegionHighlightProfiles.isOverriddenBuiltin(draft.id);
      context.useRegionColor = draft.color === null;
      context.colorValue = draft.color ?? SWATCH_COLOR;
      context.previewGrid = PREVIEW_GRID;
      context.previewGridLarge = PREVIEW_GRID_LARGE;
      context.previewStyle = previewCss(draft, SWATCH_COLOR, PREVIEW_GRID);
      context.previewStyleLarge = previewCss(draft, SWATCH_COLOR, PREVIEW_GRID_LARGE);
      context.patternOptions = REGION_HIGHLIGHT_PATTERNS.map((value) => ({
        value,
        label: REGION_HIGHLIGHT_PATTERN_LABELS[value],
        selected: value === draft.pattern,
      }));
      context.limits = REGION_HIGHLIGHT_LIMITS;
      context.isEdge = draft.pattern === "edge";
      context.isLines = draft.pattern === "hatch" || draft.pattern === "crosshatch";
    }
    return context;
  }

  override async _onRender(context: any, options: any) {
    await super._onRender(context, options);
    // range pickers and colour pickers fire input while dragging; keep the swatch live.
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
    // the pattern, dash and colour mode change which fields are shown
    if (["pattern", "useRegionColor", "dashed", "border"].includes(target?.getAttribute("name") ?? "")) this.render();
  }

  #formValues(): IProfileFormValues {
    const form = this.element as HTMLFormElement | null;
    if (!form) return {};
    const FormDataExtended = (foundry.applications.ux as unknown as { FormDataExtended: new (form: HTMLFormElement) => { object: IProfileFormValues } }).FormDataExtended;
    return new FormDataExtended(form).object;
  }

  #syncDraftFromForm(): void {
    if (!this.draft) return;
    const result = DDBRegionHighlightProfiles.draftFromForm(this.#formValues(), this.draft, this.lastCustomColor);
    this.draft = result.draft;
    this.lastCustomColor = result.lastCustomColor;
    for (const preview of this.element?.querySelectorAll<HTMLElement>(".ddbi-highlight-preview") ?? []) {
      preview.setAttribute("style", previewCss(this.draft, SWATCH_COLOR, Number(preview.dataset.grid) || PREVIEW_GRID));
    }
  }

  static selectProfile(this: DDBRegionHighlightProfiles, _event: Event, target: HTMLElement): void {
    const id = target.closest<HTMLElement>("[data-profile-id]")?.dataset.profileId;
    const profile = RegionHighlightProfiles.get(id);
    if (!profile) return;
    this.load(profile);
    this.render();
  }

  static createProfile(this: DDBRegionHighlightProfiles): void {
    const name = "New Profile";
    const base = RegionHighlightProfiles.get("minimal") ?? RegionHighlightProfiles.all()[0];
    this.draft = RegionHighlightProfiles.normalize({ ...base, name, id: RegionHighlightProfiles.newId(), builtin: false }, base);
    this.selectedId = null;
    this.render();
  }

  static duplicateProfile(this: DDBRegionHighlightProfiles): void {
    if (!this.draft) return;
    this.#syncDraftFromForm();
    const name = `${this.draft.name} Copy`;
    this.draft = RegionHighlightProfiles.normalize({ ...this.draft, name, id: RegionHighlightProfiles.newId() }, this.draft);
    this.selectedId = null;
    this.render();
  }

  static async deleteProfile(this: DDBRegionHighlightProfiles): Promise<void> {
    const id = this.selectedId;
    if (!id || RegionHighlightProfiles.isBuiltinId(id)) return;
    const proceed = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: { title: "Delete Profile?" },
      content: `<p>Delete the region highlight profile <strong>${foundry.utils.escapeHTML(this.draft?.name ?? id)}</strong>? Regions using it fall back to the Foundry look.</p>`,
    });
    if (!proceed) return;
    await RegionHighlightProfiles.remove(id);
    this.#afterStoreChange(RegionHighlightProfiles.all()[0] ?? null);
  }

  static async resetProfile(this: DDBRegionHighlightProfiles): Promise<void> {
    const id = this.selectedId;
    if (!id || !RegionHighlightProfiles.isOverriddenBuiltin(id)) return;
    await RegionHighlightProfiles.remove(id);
    this.#afterStoreChange(RegionHighlightProfiles.get(id));
  }

  static async saveProfile(this: DDBRegionHighlightProfiles): Promise<void> {
    if (!this.draft) return;
    this.#syncDraftFromForm();
    try {
      const saved = await RegionHighlightProfiles.save(this.draft);
      ui.notifications.info(`Saved region highlight profile "${saved.name}".`);
      this.#afterStoreChange(saved);
    } catch (error) {
      logger.error("Unable to save region highlight profile", { error });
      ui.notifications.error("Unable to save the region highlight profile; see the console.");
    }
  }

  static async closeApp(this: DDBRegionHighlightProfiles): Promise<void> {
    await this.close();
  }

  #afterStoreChange(profile: IRegionHighlightProfile | null): void {
    if (profile) this.load(profile);
    else {
      this.draft = null;
      this.selectedId = null;
    }
    this.render();
  }

  override async close(options?: any) {
    DDBRegionHighlightProfiles.#instance = null;
    return super.close(options);
  }

  /**
   * Keep every open activity sheet's picker current: dnd5e renders behavior fields from
   * the data model, so a saved profile would otherwise only appear after the sheet reopens.
   */
  static registerPickerRefresh(): void {
    Hooks.on<typeof REGION_HIGHLIGHT_PROFILES_CHANGED>(REGION_HIGHLIGHT_PROFILES_CHANGED, () => {
      const blank = game.i18n.localize("ddb-importer.behaviors.highlight.noProfile");
      for (const app of foundry.applications.instances.values()) {
        const element = (app as { element?: HTMLElement }).element;
        if (element && !(app instanceof DDBRegionHighlightProfiles)) refreshProfilePickers(element, blank);
      }
    });
  }

}
