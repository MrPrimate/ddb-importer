import {
  logger,
  PatreonHelper,
  MuncherSettings,
  DDBCampaigns,
} from "../lib/_module.mjs";
import DDBAppV2 from "./DDBAppV2.js";
import DDBEncounterFactory from "../parser/DDBEncounterFactory.js";

export default class DDBEncounterMunch extends DDBAppV2 {

  constructor() {
    super();
    this.encounterFactory = new DDBEncounterFactory({
      notifier: this.notifier.bind(this),
    });
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-encounter-muncher",
    classes: ["sheet", "standard-form", "dnd5e2"],
    actions: {
      importEncounter: "TODO",
    },
    position: {
      width: "800",
      height: "auto",
    },
    window: {
      icon: 'fab fa-d-and-d-beyond',
      title: "Encounter Muncher",
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  static PARTS = {
    header: { template: "modules/ddb-importer/handlebars/encounters/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    main: {
      template: "modules/ddb-importer/handlebars/encounters/main.hbs",
    },
    details: { template: "modules/ddb-importer/handlebars/encounters/details.hbs" },
    footer: { template: "modules/ddb-importer/handlebars/encounters/footer.hbs" },
  };

  /** @override */
  tabGroups = {
    sheet: "main",
  };


  /** @override */
  _getTabs() {
    const tabs = this._markTabs({
      main: {
        id: "main", group: "sheet", label: "Import", icon: "fas fa-info",
      },
    });
    return tabs;
  }

  /** @inheritDoc */
  _onRender(context, options) {
    super._onRender(context, options);

    // custom listeners


    // watch the change of the muncher-policy-selector checkboxes
    this.element.querySelectorAll("fieldset :is(dnd5e-checkbox)").forEach((checkbox) => {
      checkbox.addEventListener('change', async (event) => {
        await MuncherSettings.updateMuncherSettings(this.element, event);
        await this.render();
      });
    });

  }

  async _prepareContext(options) {
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
    const availableCampaigns = await DDBCampaigns.getAvailableCampaigns();
    const availableEncounters = await this.encounterFactory.filterEncounters();

    const characterSettings = MuncherSettings.getCharacterImportSettings();
    const muncherSettings = MuncherSettings.getMuncherSettings(false);
    const importSettings = foundry.utils.mergeObject(characterSettings, muncherSettings);

    const encounterSettings = foundry.utils.mergeObject({
      tiers,
      availableCampaigns,
      availableEncounters,
    }, MuncherSettings.getEncounterSettings());

    let context = foundry.utils.mergeObject(importSettings, encounterSettings);
    context = foundry.utils.mergeObject(await super._prepareContext(options), context, { inplace: false });
    logger.debug("Encounter: _prepareContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _preparePartContext(partId, context) {
    context.tab = context.tabs[partId];
    return context;
  }

  resetEncounter() {
    const nameHtml = this.element.querySelector("#ddb-encounter-name");
    const summaryHtml = this.element.querySelector("#ddb-encounter-summary");
    const charactersHtml = this.element.querySelector("#ddb-encounter-characters");
    const monstersHtml = this.element.querySelector("#ddb-encounter-monsters");
    const difficultyHtml = this.element.querySelector("#ddb-encounter-difficulty");
    const rewardsHtml = this.element.querySelector("#ddb-encounter-rewards");
    const progressHtml = this.element.querySelector("#ddb-encounter-progress");

    nameHtml.value = `<p id="ddb-encounter-name"><i class='fas fa-question'></i> <b>Encounter:</b></p>`;
    summaryHtml.value = `<p id="ddb-encounter-summary"><i class='fas fa-question'></i> <b>Summary:</b></p>`;
    charactersHtml.value = `<p id="ddb-encounter-characters"><i class='fas fa-question'></i> <b>Characters:</b></p>`;
    monstersHtml.value = `<p id="ddb-encounter-monsters"><i class='fas fa-question'></i> <b>Monsters:</b></p>`;
    difficultyHtml.value = `<p id="ddb-encounter-difficulty"><i class='fas fa-question'></i> <b>Difficulty:</b></p>`;
    rewardsHtml.value = `<p id="ddb-encounter-rewards"><i class='fas fa-question'></i> <b>Rewards:</b></p>`;
    progressHtml.value = `<p id="ddb-encounter-progress"><i class='fas fa-question'></i> <b>In Progress:</b></p>`;

    const importButton = this.element.querySelector("#encounter-button");
    importButton.disabled = true;
    importButton.innerText = "Import Encounter";

    // $("#ddb-importer-encounters").css("height", "auto");
    this.element.querySelector("#encounter-import-policy-use-ddb-save").disabled = true;

    this.encounterFactory.resetEncounters();
  }

  async importEncounter(_event, _target) {

    const encounterButton = this.element.querySelector("#encounter-button");
    encounterButton.disabled = true;
    encounterButton.textContent = "Munching...";

    await this.encounterFactory.importEncounter();

    encounterButton.textContent = "Encounter Munched";
    const campaignFluff = this.encounterFactory.data.campaign?.name
      && this.encounterFactory.data.campaign.name.trim() !== ""
      ? ` of ${this.encounterFactory.data.name}`
      : "";
    ui.notifications.warn(`Prepare to battle heroes${campaignFluff}, your doom awaits in ${this.encounterFactory.data.name}!`);

  }


}
