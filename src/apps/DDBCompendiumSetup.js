import SETTINGS from "../settings.js";

export default class DDBCompendiumSetup extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-settings-compendium";
    options.template = "modules/ddb-importer/handlebars/compendium.hbs";
    options.width = 500;
    return options;
  }

  static getCompendiumLookups(type, selected) {
    const excludedCompendiumPackages = [
      "dnd5e",
      "dae",
      "midiqol",
      "magicitems",
      "midi-srd",
      "dae-srd",
      "midi-qol",
      "magic-items-2",
      "chris-premades",
      "ATL",
      "ActiveAuras",
      "token-attacher",
    ];

    const selections = game.packs
      .filter((pack) =>
        pack.documentName === type
      && !excludedCompendiumPackages.includes(pack.metadata.packageName)
      )
      .reduce((choices, pack) => {
        choices[pack.collection] = {
          label: `[${pack.metadata.packageName}] ${pack.metadata.label}`,
          selected: pack.collection === selected,
        };
        return choices;
      }, {});

    return selections;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Compendium Settings";
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    const settings = [
      {
        name: "auto-create-compendium",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "auto-create-compendium"),
        description: "Create default compendiums if missing?",
        enabled: true,
      },
    ];

    const compendiums = SETTINGS.COMPENDIUMS.map((comp) => ({
      setting: comp.setting,
      name: comp.title,
      current: game.settings.get(SETTINGS.MODULE_ID, comp.setting),
      compendiums: DDBCompendiumSetup.getCompendiumLookups(comp.type, game.settings.get(SETTINGS.MODULE_ID, comp.setting)),
      auto: comp.auto,
    }));

    return {
      settings,
      compendiums,
    };
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _updateObject(event, formData) { // eslint-disable-line class-methods-use-this
    event.preventDefault();
    for (const [key, value] of Object.entries(formData)) {
      game.settings.set(SETTINGS.MODULE_ID, key, value);
    }
  }
}
