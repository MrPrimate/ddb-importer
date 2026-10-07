import { CompendiumHelper, logger, utils } from "../lib/_module";
import { findDuplicateMappings } from "../lib/CompendiumMappingCheck";
import { SETTINGS } from "../config/_module";
import DDBAppV2 from "./DDBAppV2";
import { describeDuplicateMappings, wireCompendiumMappingSelects } from "./lib/compendiumMappingSelects";

interface IMappingFixRow {
  setting: string;
  name: string;
  compendiums: object;
  sharedWith: string;
  missingDefault: boolean;
}

/**
 * Shown at startup when several compendium settings point at the same compendium and the clash
 * could not be settled automatically. Lets the GM pick a compendium per setting or create the
 * missing DDB compendiums.
 */
export default class DDBCompendiumMappingFix extends DDBAppV2 {

  /** @override - this dialog has no tabs; base _prepareContext is fully overridden */
  _getTabs(): IDDBTabs {
    return {};
  }

  /** @override */
  static override DEFAULT_OPTIONS = {
    id: "ddb-importer-compendium-mapping-fix",
    classes: ["standard-form", "dnd5e2"],
    window: {
      title: "ddb-importer.compendium-mapping.Title",
      icon: "fab fa-d-and-d-beyond",
    },
    tag: "form",
    actions: {
      createMissing: DDBCompendiumMappingFix.createMissing,
    },
    form: {
      handler: DDBCompendiumMappingFix.#handleFormSubmission,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    position: {
      width: 560,
    },
  };

  /** @inheritDoc */
  static override PARTS = {
    ...super.PARTS,
    content: {
      template: "modules/ddb-importer/handlebars/compendium-mapping/mapping-fix.hbs",
    },
    footer: { template: "modules/ddb-importer/handlebars/compendium-mapping/footer.hbs" },
  };

  /**
   * Current mapping rows, flagging the settings that share a compendium.
   * @returns {IMappingFixRow[]} one row per compendium setting
   */
  static getRows(): IMappingFixRow[] {
    const values = Object.fromEntries(SETTINGS.COMPENDIUMS.map((comp) => [comp.setting, utils.getSetting<string>(comp.setting)]));
    const groups = findDuplicateMappings(values);
    return SETTINGS.COMPENDIUMS.map((comp) => {
      const group = groups.find((g) => g.settings.includes(comp.setting));
      const sharedWith = group
        ? SETTINGS.COMPENDIUMS.filter((c) => c.setting !== comp.setting && group.settings.includes(c.setting)).map((c) => c.title)
        : [];
      return {
        setting: comp.setting,
        name: comp.title,
        compendiums: CompendiumHelper.getCompendiumLookups(comp.type, values[comp.setting]),
        sharedWith: sharedWith.join(", "),
        missingDefault: !!group && !CompendiumHelper.getDefaultDDBPack(comp),
      };
    });
  }

  override async _prepareContext(options: any) {
    const context = await super._prepareContext({ ...options, noCacheLoad: true });
    const rows = DDBCompendiumMappingFix.getRows();
    return foundry.utils.mergeObject(context, {
      rows,
      canCreate: rows.some((row) => row.missingDefault),
    }, { inplace: false }) as DDBAppV2Context;
  }

  override async _onRender(context: any, options: any): Promise<void> {
    await super._onRender(context, options);
    wireCompendiumMappingSelects(this.element);
  }

  /**
   * Creates the default DDB compendium for every clashing setting that has none, then re-runs the
   * automatic split for anything still sharing.
   * @this {DDBCompendiumMappingFix}
   * @param {Event} event the click event
   */
  static async createMissing(this: DDBCompendiumMappingFix, event: Event) {
    event.preventDefault();
    const settings = DDBCompendiumMappingFix.getRows().filter((row) => row.missingDefault).map((row) => row.setting);
    try {
      const created = await CompendiumHelper.createMissingDDBCompendiums(settings);
      if (created.length > 0) {
        ui.notifications.info(game.i18n.format("ddb-importer.compendium-mapping.Created", { list: created.join(", ") }));
      }
      const unresolved = await CompendiumHelper.checkCompendiumMappings();
      if (unresolved.length === 0) {
        await this.close();
        return;
      }
    } catch (error) {
      logger.error("Unable to create the missing DDB compendiums", error);
      ui.notifications.error(game.i18n.localize("ddb-importer.compendium-mapping.CreateFailed"));
    }
    await this.render();
  }

  /**
   * Saves the chosen mappings, refusing while two settings still share a compendium.
   * @this {DDBCompendiumMappingFix}
   * @param {Event|SubmitEvent} _event the form submission event
   * @param {HTMLFormElement} _form the submitted form
   * @param {FormDataExtended} formData data from the form
   */
  static async #handleFormSubmission(this: DDBCompendiumMappingFix, _event: any, _form: any, formData: any) {
    const values: Record<string, string> = Object.fromEntries(
      SETTINGS.COMPENDIUMS.map((comp) => [comp.setting, (formData.object[comp.setting] as string | null) ?? ""]),
    );
    const duplicates = findDuplicateMappings(values);
    if (duplicates.length > 0) {
      const titles = Object.fromEntries(SETTINGS.COMPENDIUMS.map((comp) => [comp.setting, comp.title]));
      ui.notifications.error(game.i18n.format("ddb-importer.compendium-mapping.DuplicateSave", {
        list: describeDuplicateMappings(duplicates, titles),
      }));
      return;
    }
    for (const [setting, value] of Object.entries(values)) {
      await utils.setSetting(setting, value);
    }
    await this.close();
  }

}
