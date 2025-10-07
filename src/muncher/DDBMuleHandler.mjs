import { DDBCampaigns, DDBProxy, logger, Secrets } from "../lib/_module.mjs";
import DDBCharacter from "../parser/DDBCharacter.js";
import { DDBReferenceLinker } from "../parser/lib/_module.mjs";

export default class DDBMuleHandler {

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
    this.allowedSourceIds = sources ? sources : [];
    this.allowedHomebrew = homebrew;
    this.type = type;
  }

  // eslint-disable-next-line class-methods-use-this
  async init() {
    await DDBReferenceLinker.importCacheLoad();
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
    const cobaltCookie = Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = game.settings.get("ddb-importer", "beta-key");
    const campaignId = DDBCampaigns.getCampaignId();
    const proxyCampaignId = campaignId === "" ? null : campaignId;
    let body = {
      cobalt: cobaltCookie,
      betaKey,
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
      this.source = await response.json();

      console.warn({
        this: this,
        source: this.source,
      });

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

  async handleClassMunch() {
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
      console.warn(`Processing ${total} subclass choices for subclass ${subClassData.debug.name}`, { filteredSubClassChoices });
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
          compendiumImportTypes: ["classes", "features"],
        });
        ddbCharacter.source = { ddb: newStub };
        await ddbCharacter.process();
      }
    }
  }


  async handleFeatMunch() {
    const ddbStub = await this._buildDDBStub();
    const featData = this.source.featData;
    foundry.utils.mergeObject(ddbStub.character, featData);

    // for the subclass we now loop through each class choice
    console.warn(`Stub for feats:`, { ddbStub, featData });

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

    const ddbCharacter = new DDBCharacter({
      currentActor: mockCharacter,
      characterId: this.characterId,
      selectResources: false,
      enableSummons: true,
      addToCompendiums: true,
      compendiumImportTypes: ["feats"],
    });
    ddbCharacter.source = { ddb: ddbStub };
    await ddbCharacter.process();

  }


  static async munchFeats({ characterId, sources, homebrew } = {}) {
    const muleHandler = new DDBMuleHandler({ characterId, sources, homebrew, type: "feat" });
    await muleHandler.init();
    await muleHandler._fetchMuleData();
    await muleHandler.handleFeatMunch();

    console.warn("Munch Complete", {
      characterId,
      muleHandler,
    });
  }

  static async munchClass({ classId, characterId, sources, homebrew } = {}) {
    const muleHandler = new DDBMuleHandler({ classId, characterId, sources, homebrew, type: "class" });
    await muleHandler.init();
    await muleHandler._fetchMuleData();
    await muleHandler.handleClassMunch();

    console.warn("Munch Complete", {
      classId,
      characterId,
      muleHandler,
    });
  }

  // TODO:
  // Infusions
  // Backgrounds
  // Feats
  // Species

}
