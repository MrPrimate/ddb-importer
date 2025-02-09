import { DICTIONARY } from "../../config/_module.mjs";
import { utils, logger } from "../../lib/_module.mjs";
import DDBAction from "./DDBAction.js";


export default class DDBAttackAction extends DDBAction {

  static FORCE_WEAPON_FEATURES = DICTIONARY.parsing.attackActions.FORCE_WEAPON_FEATURES;

  _init() {
    this.isAction = true;
    this.documentType = DDBAttackAction.FORCE_WEAPON_FEATURES.includes(this.ddbDefinition.name)
      ? "weapon"
      : "feat";
    logger.debug(`Generating Attack Action ${this.ddbDefinition.name}`);
  }

  async build() {
    try {
      if (this.ddbData.isMartialArts) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.type", "Martial Arts");
      };
      if (this.is2014 && DDBAction.SKIPPED_2014_ONLY_ACTIONS.includes(this.originalName)) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.skip", true);
      } else if (!this.is2014 && DDBAction.SKIPPED_2024_ONLY_ACTIONS.includes(this.originalName)) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.skip", true);
      }
      this.data.system.proficient = this.ddbDefinition.isProficient ? 1 : 0;
      this._generateDescription();
      this.data.system.equipped = true;
      this.data.system.rarity = "";
      this.data.system.identified = true;
      this._generateRange();
      this._generateLimitedUse();
      this._generateProperties();
      this._generateSystemType(this.type);
      this._generateSystemSubType();
      if (this.documentType === "weapon") {
        this._generateDamage();
      }
      await this._generateSummons();
      await this._generateCompanions();
      if (!this.enricher.stopDefaultActivity)
        await this._generateActivity();
      await this.enricher.addAdditionalActivities(this);

      this._generateResourceFlags();
      this.cleanup();
      await this.enricher.addDocumentOverride();
      await this._addEffects(undefined, this.type);

      this._addCustomValues();
      this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);

    } catch (err) {
      logger.warn(
        `Unable to Generate Attack Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
