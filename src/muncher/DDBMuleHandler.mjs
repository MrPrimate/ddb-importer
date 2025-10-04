import { DDBCampaigns, DDBProxy, FileHelper, logger, Secrets } from "../lib/_module.mjs";
import { DDBReferenceLinker, FilterModifiers, ProficiencyFinder } from "../parser/lib/_module.mjs";

export default class DDBMuleHandler {

  characterId = null;

  classId = null;

  source = null;

  proficiencyFinder = null;



  constructor({
    characterId,
    classId,
  } = {}) {
    this.characterId = characterId;
    this.classId = classId;
  }

  // eslint-disable-next-line class-methods-use-this
  async init() {
    await DDBReferenceLinker.importCacheLoad();
  }


  async fetchCharacterClassMuleData() {
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
      sources: [1, 2], // TODO add source parser
      includeHomebrew: false, // TODDO add homebrew option detection
    };

    try {
      const response = await fetch(`${parsingApi}/mule/class/${this.classId}`, {
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
      character: foundry.utils.deepClone(this.source.emptyCharacter),
      classOptions: [],
      decorations: foundry.utils.deepClone(this.source.emptyCharacter.decorations),
      infusions: {
        known: [],
        items: [],
        infusions: []
      },
      name: foundry.utils.deepClone(this.source.emptyCharacter.name),
      originOptions: [],
      startingEquipment: {
        slots: [],
      },
    };
    return stub;
  }

  async handleClassMunch() {
    // loop through each subclass and create a stub to import
    for (const subclass of this.source.subclasses) {
      const ddbStub = await this._buildDDBStub();
      const subclassData = ddbStub.subClassData.find((sc) => sc.addData.classId === subclass.id);
      if (!subclassData) {
        logger.error(`Subclass data not found for subclass ID: ${subclass.id}`, {
          subclass,
          this: this,
        });
        continue;
      }
      foundry.utils.mergeObject(subclass, subclassData.data);

      // for the subclass we now loop through each class choice

    }
  }

  static async munchClass({ classId, characterId } = {}) {
    const muleHandler = new DDBMuleHandler({ classId, characterId });
    await muleHandler.init();
    await muleHandler.fetchCharacterClassMuleData();
    await muleHandler.handleClassMunch();
  }

  // TODO:
  // Infusions
  // Backgrounds
  // Feats
  // Species

}
