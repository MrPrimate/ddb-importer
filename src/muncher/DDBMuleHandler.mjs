import { DICTIONARY, SETTINGS } from "../config/_module.mjs";
import { DDBCampaigns, DDBProxy, logger, PatreonHelper, Secrets } from "../lib/_module.mjs";
import DDBCharacter from "../parser/DDBCharacter.js";
import { DDBReferenceLinker } from "../parser/lib/_module.mjs";

export default class DDBMuleHandler {

  static LOADING_MESSAGES = DICTIONARY.messages.loading;

  characterId = null;

  classId = null;

  source = null;

  proficiencyFinder = null;

  allowedSourceIds = [];

  allowedHomebrew = false;

  type = null;

  constructor({
    characterId,
    classId,
    sources = null,
    homebrew = false,
    type = null,
  } = {}) {
    this.characterId = characterId;
    this.classId = classId;
    this.allowedSourceIds = sources ? sources : [1, 2, 148, 145];
    this.allowedHomebrew = homebrew;
    this.type = type;
  }

  // eslint-disable-next-line class-methods-use-this
  async _init() {
    await DDBReferenceLinker.importCacheLoad();
    await this._fetchMuleData();
  }

  notifier({ progress, section, message } = { }) {
    // Notify the user about the import progress
    if (progress) {
      logger.info(`${progress.current}/${progress.total} : ${message}`);
    } else {
      logger.info(`${message}`);
    }
  }

  get URL() {
    switch (this.type) {
      case "class":
        return `/mule/class/${this.classId}`;
      case "feat":
        return `/mule/feat`;
      case "infusion":
        return `/mule/infusion`;
      case "background":
        return `/mule/background`;
      case "species":
        return `/mule/species`;
      default:
        throw new Error(`Unknown mule type ${this.type}`);
    }

  }

  async _fetchMuleData() {
    const parsingApi = DDBProxy.getProxy();
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    let body = {
      cobalt: Secrets.getCobalt(),
      betaKey: game.settings.get(SETTINGS.MODULE_ID, "beta-key"),
      characterId: this.characterId,
      campaignId: proxyCampaignId,
      filterModifiers: false,
      splitSpells: true,
      sources: this.allowedSourceIds,
      includeHomebrew: this.allowedHomebrew,
    };

    try {
      const response = await fetch(`${parsingApi}${this.URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow", // manual, *follow, error
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      });
      console.warn("response", response);

      const jsonResponse = await response.json();
      if (jsonResponse.success) {
        this.source = jsonResponse.data;
      } else {
        throw new Error(`Mule fetch failed: ${jsonResponse.message}`);
      }
    } catch (error) {
      logger.error("JSON Fetch Error");
      logger.error(error);
      logger.error(error.stack);
      throw error;
    }
  }

  async _buildDDBStub() {
    const stub = {
      backgroundEquipment: { slots: [] },
      character: foundry.utils.deepClone(this.source.baseCharacter),
      classOptions: [],
      decorations: foundry.utils.deepClone(this.source.baseCharacter.decorations),
      infusions: {
        known: [],
        items: [],
        infusions: [],
      },
      name: foundry.utils.deepClone(this.source.baseCharacter.name),
      originOptions: [],
      startingEquipment: {
        slots: [],
      },
    };
    return stub;
  }

  async _handleClassMunch() {
    // loop through each subclass and create a stub to import
    const classTotal = Object.keys(this.source.subClassData).length + 1;
    let classCurrent = 0;
    for (const subClassData of Object.values(this.source.subClassData)) {
      const ddbStub = await this._buildDDBStub();
      foundry.utils.mergeObject(ddbStub.character, subClassData.data);

      // for the subclass we now loop through each class choice
      console.warn(`Stub for subclass ${subClassData.debug.subClassId}:`, { ddbStub, subClassData });

      this.notifier({
        progress: { current: ++classCurrent, total: classTotal },
        message: `Processing subclass ${subClassData.debug.subclassName}`,
      });

      const options = {
        temporary: true,
        displaySheet: false,
      };
      const mockCharacter = new Actor.implementation({
        name: subClassData.debug.subclassName,
        type: "character",
      }, options);

      // const classChoices = this.source.subClassChoicesData.filter((c) => c.addData.classId === this.source.class.id);
      // if (classChoices.lengh > 0) {
      //   logger.error(`Oh, the class ${this.source.class.name} has sub class choices for the class`);
      // }

      const filteredSubClassChoices = this.source.subClassChoicesData.filter((c) => c.debug.subClassId === subClassData.debug.subClassId);

      const total = filteredSubClassChoices.length + 1;
      let current = 0;
      console.warn(`Processing ${total} subclass choices for subclass ${subClassData.debug.subclassName}`, { filteredSubClassChoices });
      for (const subClassChoiceData of filteredSubClassChoices) {
        this.notifier({
          progress: { current: ++current, total },
          message: `Processing subclass choice ${subClassChoiceData.debug.name} choice feature`,
        });
        const newStub = foundry.utils.deepClone(ddbStub);
        foundry.utils.mergeObject(newStub.character, subClassChoiceData.data);

        console.warn(`Processing subclass choice ${subClassChoiceData.debug.name} choice feature (${current + 1} of ${total})`, {
          newStub,
          subClassChoiceData,
          current,
          total,
        });
        const ddbCharacter = new DDBCharacter({
          currentActor: mockCharacter,
          characterId: this.characterId,
          selectResources: false,
          enableSummons: true,
          addToCompendiums: true,
          compendiumImportTypes: ["classes", "features", "subclasses"],
        });
        ddbCharacter.source = { ddb: newStub };
        await ddbCharacter.process();
      }
    }
  }


  async _handleFeatMunch() {
    const ddbStub = await this._buildDDBStub();

    this.notifier({
      message: `Processing feats`,
    });

    const options = {
      temporary: true,
      displaySheet: false,
    };
    const mockCharacter = new Actor.implementation({
      name: "Feat Muncher",
      type: "character",
    }, options);

    const total = this.source.featOptions.reduce((acc, curr) => acc + curr.data.feats.length, 0);
    let current = 1;
    let count = 0;
    console.warn(`Processing ${total} feats`, { feats: this.source.featOptions, this: this });
    for (const featData of this.source.featOptions) {
      count += featData.data.feats.length;
      this.notifier({
        progress: { current: `${current} - ${count}`, total },
        message: `Processing feats ${current} - ${count} of ${total}`,
      });
      const newStub = foundry.utils.deepClone(ddbStub);
      foundry.utils.mergeObject(newStub.character, featData.data);

      console.warn(`Processing feats (${current} - ${count} of ${total})`, {
        newStub,
        featData,
        current,
        total,
        count,
      });

      const ddbCharacter = new DDBCharacter({
        currentActor: mockCharacter,
        characterId: this.characterId,
        selectResources: false,
        enableSummons: true,
        addToCompendiums: true,
        compendiumImportTypes: ["feats"],
      });
      ddbCharacter.source = { ddb: newStub };
      await ddbCharacter.process();
      current = count + 1;
    }

  }

  async process() {
    await this._init();
    switch (this.type) {
      case "class":
        await this._handleClassMunch();
        break;
      case "feat":
        await this._handleFeatMunch();
        break;
      case "infusion":
        // await this._handleInfusionMunch();
        throw new Error("Infusion munching not yet supported");
      case "background":
        // await this._handleBackgroundMunch();
        throw new Error("Background munching not yet supported");
      case "species":
        // await this._handleSpeciesMunch();
        throw new Error("Species munching not yet supported");
      default:
        throw new Error(`Unknown munch type ${this.type}`);
    }
  }


  static async munchFeats({ characterId, sources, homebrew } = {}) {
    const muleHandler = new DDBMuleHandler({ characterId, sources, homebrew, type: "feat" });
    await muleHandler.process();

    console.warn("Munch Complete", {
      characterId,
      muleHandler,
    });
  }

  static async munchClass({ classId, characterId, sources, homebrew } = {}) {
    const muleHandler = new DDBMuleHandler({ classId, characterId, sources, homebrew, type: "class" });
    await muleHandler.process();

    console.warn("Munch Complete", {
      classId,
      characterId,
      muleHandler,
    });
  }

  static async munchClasses({ characterId, classIds = [], sources, homebrew } = {}) {
    const parsingApi = DDBProxy.getProxy();
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    const body = {
      cobalt: Secrets.getCobalt(),
      campaignId: proxyCampaignId,
      betaKey: PatreonHelper.getPatreonKey(),
      sources: sources ?? [1, 2, 148, 145],
    };

    const response = await fetch(`${parsingApi}/proxy/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();


    if (!data.success) {
      logger.error(`Failure: ${data.message}`, { data});
      throw new Error(data.message);
    }


    for (const klass of data.data) {
      if (classIds.length > 0 && !classIds.includes(klass.id)) {
        logger.debug(`Skipping class ${klass.name} (${klass.id})`);
        continue;
      }
      console.error(`Munching class ${klass.name} (${klass.id})`);
      logger.info(`Munching class ${klass.name} (${klass.id})`);
      await DDBMuleHandler.munchClass({ classId: klass.id, characterId, sources, homebrew });
    }

    console.warn("Full Class Munch Complete", {
      characterId,
      sources,
      homebrew,
    });


  }

  // TODO:
  // Infusions
  // Backgrounds
  // Feats
  // Species

}
