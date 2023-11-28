import logger from "../../logger.js";
import DDBAction from "./DDBAction.js";


export default class DDBAttackAction extends DDBAction {

  static EXCLUDED_ACTION_FEATURES = ["Unarmed Strike"];

  _init() {
    this.isAction = true;
    this.documentType = !DDBAttackAction.EXCLUDED_ACTION_FEATURES.includes(this.ddbDefinition.name)
      ? "feat"
      : "weapon";
    logger.debug(`Generating Attack Action ${this.ddbDefinition.name}`);
  }

  build() {
    try {
      if (this.ddbData.isMartialArts) {
        setProperty(this.data, "flags.ddbimporter.dndbeyond.type", "Martial Arts");
      };
      this.data.system.proficient = this.ddbDefinition.isProficient ? 1 : 0;
      this._generateDescription();
      this.data.system.equipped = true;
      this.data.system.rarity = "";
      this.data.system.identified = true;
      this._generateActivation();
      this._generateRange();
      this._generateAttackType();
      this._generateWeaponType();
      this._generateLimitedUse();
      this._generateResourceConsumption();
      this._generateProperties();
      this._generateSystemType();

      if (["line", "cone"].includes(this.data.system.target?.type)) {
        setProperty(this.data, "system.duration.units", "inst");
      }

      this._generateFlagHints();
      this._generateResourceFlags();
      this._addEffects();
      this._generateLevelScaleDice();

      this._addCustomValues();

    } catch (err) {
      logger.warn(
        `Unable to Generate Attack Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension"
      );
      logger.error("Error", err);
    }
  }

}
