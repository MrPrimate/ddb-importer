import {
  logger,
  PatreonHelper,
  MuncherSettings,
  DDBCampaigns,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBAppV2 from "./DDBAppV2.js";
import DDBEncounterImporter from "../muncher/DDBEncounterImporter.mjs";

export default class DDBEncounterMunch extends DDBAppV2 {

  constructor() {
    super();
    this.encounterImporter = new DDBEncounterImporter({
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
    const availableEncounters = await this.encounterImporter.ddbEncounters.filterEncounters();

    const characterSettings = MuncherSettings.getCharacterImportSettings();
    const muncherSettings = MuncherSettings.getMuncherSettings(false);

    const importSettings = foundry.utils.mergeObject(characterSettings, muncherSettings);

    const encounterConfig = [
      {
        name: "encounter-import-policy-missing-characters",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-characters"),
        enabled: true,
        hint: "",
        label: "Import missing characters?",
      },
      {
        name: "encounter-import-policy-missing-monsters",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-monsters"),
        enabled: true,
        hint: "",
        label: "Import missing monsters?",
      },
      {
        name: "encounter-import-policy-create-journal",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-journal"),
        enabled: true,
        hint: "",
        label: "Create encounter journal entry?",
      },
      {
        name: "encounter-import-policy-use-ddb-save",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-use-ddb-save"),
        enabled: false,
        hint: "HP for monsters and initiative for all",
        label: "Use save information from Encounter?",
      },
      {
        name: "encounter-import-policy-create-scene",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene"),
        enabled: true,
        hint: "Also adds available characters and NPC's",
        label: "Create/update a scene?",
      },
      {
        name: "encounter-import-policy-existing-scene",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene"),
        enabled: true,
        hint: "",
        label: "Use an existing scene?",
      },
    ];

    const scenes = game.scenes.filter((scene) => !scene.flags?.ddbimporter?.encounters)
      .map((scene) => {
        const folderName = scene.folder ? `[${scene.folder.name}] ` : "";
        const s = {
          name: `${folderName}${scene.name}`,
          id: scene.id,
        };
        return s;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const encounterSettings = {
      tiers,
      availableCampaigns,
      availableEncounters,
      encounterConfig,
      sceneImg: DDBEncounterMunch.SCENE_IMG,
      scenes,
      createSceneSelect: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene"),
      existingSceneSelect: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene"),
    };

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

    this.encounterImporter.resetEncounter();
  }

  async importEncounter(_event, _target) {

    const encounterButton = this.element.querySelector("#encounter-button");
    encounterButton.disabled = true;
    encounterButton.textContent = "Munching...";

    await this.encounterImporter.importEncounter();

    encounterButton.textContent = "Encounter Munched";
    const campaignFluff = this.encounterImporter.encounter.campaign?.name && this.encounterImporter.encounter.campaign.name.trim() !== ""
      ? ` of ${this.encounterImporter.encounter.name}`
      : "";
    ui.notifications.warn(`Prepare to battle heroes${campaignFluff}, your doom awaits in ${this.encounterImporter.encounter.name}!`);

  }

  activateListeners(html) {
    super.activateListeners(html);

    $(html)
      .find('.sync-policy input[type="checkbox"]')
      .on("change", (event) => {
        game.settings.set(
          "ddb-importer",
          "sync-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked,
        );
      });

    $(html)
      .find('.encounter-config input[type="checkbox"]')
      .on("change", (event) => {
        switch (event.currentTarget.dataset.section) {
          case "create-scene": {
            game.settings.set(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene", false);
            if (event.currentTarget.checked) $("#encounter-scene-select").prop("disabled", true);
            $("#encounter-scene-img-select").prop("disabled", !event.currentTarget.checked);
            $("#encounter-import-policy-existing-scene").prop('checked', false);
            break;
          }
          case "existing-scene": {
            game.settings.set(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene", false);
            if (event.currentTarget.checked) $("#encounter-scene-img-select").prop("disabled", true);
            $("#encounter-scene-select").prop("disabled", !event.currentTarget.checked);
            $("#encounter-import-policy-create-scene").prop('checked', false);
            break;
          }
          // no default
        };
        game.settings.set(
          "ddb-importer",
          "encounter-import-policy-" + event.currentTarget.dataset.section,
          event.currentTarget.checked,
        );
      });

    // img change
    html.find("#encounter-scene-img-select").on("change", async () => {
      const imgSelect = html.find("#encounter-scene-img-select");
      this.img = imgSelect[0].selectedOptions[0] ? imgSelect[0].selectedOptions[0].value : "";
    });

    html.find("#encounter-scene-select").on("change", async () => {
      const imgSelect = html.find("#encounter-scene-select");
      this.sceneId = imgSelect[0].selectedOptions[0] ? imgSelect[0].selectedOptions[0].value : "";
    });

    // filter campaigns
    html.find("#encounter-campaign-select").on("change", async () => {
      const campaignSelection = html.find("#encounter-campaign-select");
      // get selected campaign from html selection
      const campaignId = campaignSelection[0].selectedOptions[0]
        ? campaignSelection[0].selectedOptions[0].value
        : undefined;
      const encounters = await this.ddbEncounters.filterEncounters(campaignId);
      const campaignSelected = campaignId && campaignId !== "";
      let encounterList = `<option value="">Select encounter:</option>`;
      encounters.forEach((encounter) => {
        encounterList += `<option value="${encounter.id}">${encounter.name}${
          campaignSelected || !encounter.campaign ? "" : ` (${encounter.campaign.name})`
        }</option>\n`;
      });
      const list = html.find("#encounter-select");
      list[0].innerHTML = encounterList;
      this.resetEncounter(html);
    });

    // encounter change
    html.find("#encounter-select").on("change", async () => {
      this.resetEncounter(html);
      const encounterSelection = html.find("#encounter-select");
      const encounterId = encounterSelection[0].selectedOptions[0]
        ? encounterSelection[0].selectedOptions[0].value
        : undefined;

      const encounter = await this.parseEncounter(encounterId);
      // console.warn(encounter);

      const nameHtml = html.find("#ddb-encounter-name");
      const summaryHtml = html.find("#ddb-encounter-summary");
      const charactersHtml = html.find("#ddb-encounter-characters");
      const monstersHtml = html.find("#ddb-encounter-monsters");
      const difficultyHtml = html.find("#ddb-encounter-difficulty");
      const rewardsHtml = html.find("#ddb-encounter-rewards");
      const progressHtml = html.find("#ddb-encounter-progress");

      const missingCharacters = encounter.missingCharacters
        ? `fa-times-circle' style='color: red`
        : `fa-check-circle' style='color: green`;
      const missingMonsters = encounter.missingMonsters
        ? `fa-times-circle' style='color: red`
        : `fa-check-circle' style='color: green`;

      const goodCharacters = encounter.goodCharacterData.map((character) => `${character.name}`).join(", ");
      const goodMonsters = encounter.goodMonsterIds.map((monster) => `${monster.name}`).join(", ");
      const neededCharactersHTML = encounter.missingCharacters
        ? ` <span style="color: red"> Missing ${
          encounter.missingCharacterData.length
        }: ${encounter.missingCharacterData.map((character) => character.name).join(", ")}</span>`
        : "";
      const neededMonstersHTML = encounter.missingMonsters
        ? ` <span style="color: red"> Missing ${
          encounter.missingMonsterIds.length
        }. DDB Id's: ${encounter.missingMonsterIds.map((monster) => monster.ddbId).join(", ")}</span>`
        : "";

      nameHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Encounter:</b> ${encounter.name}`;
      if (encounter.summary && encounter.summary.trim() !== "") {
        summaryHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Summary:</b> ${encounter.summary}`;
      }
      if (encounter.goodCharacterData.length > 0 || encounter.missingCharacterData.length > 0) {
        charactersHtml[0].innerHTML = `<i class='fas ${missingCharacters}'></i> <b>Characters:</b> ${goodCharacters}${neededCharactersHTML}`;
      }
      if (encounter.goodMonsterIds.length > 0 || encounter.missingMonsterIds.length > 0) {
        monstersHtml[0].innerHTML = `<i class='fas ${missingMonsters}'></i> <b>Monsters:</b> ${goodMonsters}${neededMonstersHTML}`;
      }
      difficultyHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Difficulty:</b> <span style="color: ${encounter.difficulty.color}">${encounter.difficulty.name}</span>`;
      if (encounter.rewards && encounter.rewards.trim() !== "") {
        rewardsHtml[0].innerHTML = `<i class='fas fa-check-circle' style='color: green'></i> <b>Rewards:</b> ${encounter.rewards}`;
      }

      progressHtml[0].innerHTML = encounter.inProgress
        ? `<i class='fas fa-times-circle' style='color: red'></i> <b>In Progress:</b> <span style="color: red"> Encounter in progress on <a href="https://www.dndbeyond.com/combat-tracker/${this.encounter.id}">D&D Beyond!</a></span>`
        : `<i class='fas fa-check-circle' style='color: green'></i> <b>In Progress:</b> No`;

      $("#encounter-import-policy-use-ddb-save").prop("disabled", !encounter.inProgress);
      $("#ddb-importer-encounters").css("height", "auto");
      $("#encounter-button").prop("disabled", false);
    });

  }


}
