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


  async fetchMuleData() {
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

      if (!this.source.success) return;


      // this.source.ddb = FilterModifiers.fixCharacterLevels(this.source.ddb);
      // // update proficiency finder with a character based version
      // this.proficiencyFinder = new ProficiencyFinder({ ddb: this.source.ddb });

      // load some required content
      await DDBReferenceLinker.importCacheLoad();

      // logger.debug("DDB Data to parse:", foundry.utils.duplicate(this.source.ddb));
      // logger.debug("currentActorId", this.currentActorId);
      // try {
      //   // this parses the json and sets the results as this.data
      //   await this._parseCharacter();
      //   logger.debug("finalParsedData", foundry.utils.duplicate({ source: this.source, data: foundry.utils.deepClone(this.data) }));
      // } catch (error) {
      //   if (game.settings.get("ddb-importer", "debug-json")) {
      //     FileHelper.download(JSON.stringify(this.source), `${this.characterId}-raw.json`, "application/json");
      //   }
      //   throw error;
      // }
    } catch (error) {
      logger.error("JSON Fetch and Parse Error");
      logger.error(error);
      logger.error(error.stack);
      throw error;
    }
  }

}
