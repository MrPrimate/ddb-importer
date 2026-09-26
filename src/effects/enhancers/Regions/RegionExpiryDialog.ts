import utils from "../../../lib/Utils";
import { REGION_EXPIRY_REASONS, regionExpiryReasonLabel } from "./RegionExpiryReasons";

const I18N = "ddb-importer.regionExpiry";

/**
 * Display data for one activity-placed template Region offered for removal.
 */
export interface IRegionExpiryEntry {
  region: RegionDocument;
  uuid: string;
  name: string;
  img: string;
  itemName: string | null;
  activityName: string | null;
  shape: string | null;
  size: string | null;
  spellLevel: number | string | null;
  behaviors: string[];
  effectCount: number;
  reason: string;
}

interface IRegionExpiryDialogOptions {
  entries?: IRegionExpiryEntry[];
  classes?: string[];
}

/**
 * Prompt the GM to confirm which expired activity templates should be removed from their
 * scenes. Renders a checkbox row per template; resolves with the uuids the GM confirmed.
 */
export default class RegionExpiryDialog extends dnd5e.applications.api.Dialog5e {

  constructor(options: IRegionExpiryDialogOptions = {}) {
    super(options);
    this.#entries = options.entries ?? [];
  }

  /* -------------------------------------------- */

  /** @override */
  static override DEFAULT_OPTIONS = {
    classes: ["ddbi-region-expiry"],
    actions: {
      removeSelected: RegionExpiryDialog.#onRemoveSelected,
      keepAll: RegionExpiryDialog.#onKeepAll,
      toggleAll: RegionExpiryDialog.#onToggleAll,
    },
    position: {
      width: 480,
    },
    window: {
      title: `${I18N}.title`,
      icon: "fa-solid fa-explosion",
    },
    buttons: [
      {
        action: "removeSelected",
        default: true,
        icon: "fa-solid fa-trash",
        label: `${I18N}.removeSelected`,
        type: "button",
      },
      {
        action: "keepAll",
        icon: "fa-solid fa-xmark",
        label: `${I18N}.keepAll`,
        type: "button",
      },
    ],
    entries: null as IRegionExpiryEntry[] | null,
  };

  /* -------------------------------------------- */

  /**
   * Templates being offered for removal.
   */
  #entries: IRegionExpiryEntry[];

  get entries(): IRegionExpiryEntry[] {
    return this.#entries;
  }

  /* -------------------------------------------- */

  /**
   * Uuids the GM confirmed for removal, or null while the dialog is unresolved.
   * Dismissing the dialog (escape, close button) resolves as "keep all".
   */
  #result: string[] | null = null;

  get result(): string[] | null {
    return this.#result;
  }

  /* -------------------------------------------- */

  /** @override */
  override get subtitle(): string {
    return utils.localizePlural(`${I18N}.templates`, this.#entries.length);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  override async _prepareContentContext(context: any, options: any) {
    context = await super._prepareContentContext(context, options);
    context.content = RegionExpiryDialog.#buildContent(this.#entries);
    return context;
  }

  /* -------------------------------------------- */

  /**
   * Build the dialog body. Kept as an HTML string so no .hbs file is needed while still
   * reusing Dialog5e's `content` part (templates/shared/dialog-content.hbs is `{{{ content }}}`).
   */
  static #buildContent(entries: IRegionExpiryEntry[]): string {
    const escape = foundry.utils.escapeHTML;
    const rows = entries.map((entry) => {
      const tags: string[] = [];
      if (entry.shape) tags.push(entry.shape);
      if (entry.size) tags.push(entry.size);
      if (entry.spellLevel) tags.push(game.i18n.format(`${I18N}.level`, { level: String(entry.spellLevel) }));
      for (const behavior of entry.behaviors) tags.push(behavior);
      if (entry.effectCount) tags.push(utils.localizePlural(`${I18N}.appliedEffects`, entry.effectCount));
      const subtitle = [entry.itemName, entry.activityName].filter((part) => part)
        .map((part) => escape(part as string)).join(" &rsaquo; ");
      return `
      <li class="template-entry">
        <input type="checkbox" name="templates" value="${escape(entry.uuid)}" checked
               aria-label="${escape(entry.name)}">
        <img class="entry-image" src="${escape(entry.img)}" alt="">
        <div class="entry-details">
          <div class="entry-name">${escape(entry.name)}</div>
          ${subtitle ? `<div class="entry-subtitle">${subtitle}</div>` : ""}
          <div class="entry-tags">${tags.map((t) => `<span class="tag">${escape(t)}</span>`).join("")}</div>
        </div>
        <div class="entry-reason">${escape(regionExpiryReasonLabel(entry.reason))}</div>
      </li>`;
    }).join("");

    const combatOnly = entries.length
      && entries.every((entry) => entry.reason === REGION_EXPIRY_REASONS.combat);
    const hint = combatOnly
      ? game.i18n.localize(`${I18N}.hint.combat`)
      : utils.localizePlural(`${I18N}.hint.expired`, entries.length);

    return `
    <p class="template-expiry-hint">${escape(hint)}</p>
    <ul class="template-expiry-list">${rows}</ul>
    <button type="button" class="template-expiry-toggle" data-action="toggleAll">
      <i class="fa-solid fa-check-double" inert></i> <span>${escape(game.i18n.localize(`${I18N}.toggleAll`))}</span>
    </button>`;
  }

  /* -------------------------------------------- */

  /**
   * Handle confirming removal of the checked templates.
   */
  static #onRemoveSelected(this: RegionExpiryDialog) {
    const checked = this.element.querySelectorAll<HTMLInputElement>("input[name=\"templates\"]:checked");
    this.#result = Array.from(checked).map((input) => input.value);
    void this.close();
  }

  /* -------------------------------------------- */

  /**
   * Handle dismissing every offered template.
   */
  static #onKeepAll(this: RegionExpiryDialog) {
    this.#result = [];
    void this.close();
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling every checkbox at once.
   */
  static #onToggleAll(this: RegionExpiryDialog) {
    const inputs = Array.from(this.element.querySelectorAll<HTMLInputElement>("input[name=\"templates\"]"));
    const target = !inputs.every((input) => input.checked);
    for (const input of inputs) input.checked = target;
  }

  /* -------------------------------------------- */

  /**
   * Display the prompt.
   * @param entries  Prepared display data for each template.
   * @returns Uuids of the templates to remove. Empty if dismissed.
   */
  static async prompt(entries: IRegionExpiryEntry[]): Promise<string[]> {
    return new Promise((resolve) => {
      const dialog = new this({ entries });
      dialog.addEventListener("close", () => resolve(dialog.result ?? []), { once: true });
      dialog.render({ force: true });
    });
  }

}
