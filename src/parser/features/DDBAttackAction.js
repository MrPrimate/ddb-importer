import logger from "../../logger.js";
import DDBAction from "./DDBAction.js";


export default class DDBAttackAction extends DDBAction {

  static FORCE_WEAPON_FEATURES = [
    "Unarmed Strike",
    "Psychic Blades: Attack (DEX)",
    "Psychic Blades: Attack (STR)",
    "Psychic Blades: Bonus Attack (DEX)",
    "Psychic Blades: Bonus Attack (STR)",
    "Thunder Gauntlets",
    "Lightning Launcher",
    "Guardian Armor: Thunder Gauntlets",
    "Guardian Armor: Thunder Gauntlets (STR)",
    "Infiltrator Armor: Lightning Launcher",
    "Infiltrator Armor: Lightning Launcher (DEX)",
    "Arms of the Astral Self (WIS)",
    "Arms of the Astral Self (DEX/STR)",
  ];

  _init() {
    this.isAction = true;
    this.documentType = DDBAttackAction.FORCE_WEAPON_FEATURES.includes(this.ddbDefinition.name)
      ? "weapon"
      : "feat";
    logger.debug(`Generating Attack Action ${this.ddbDefinition.name}`);
  }

  build() {
    try {
      if (this.ddbData.isMartialArts) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.type", "Martial Arts");
      };
      this.data.system.proficient = this.ddbDefinition.isProficient ? 1 : 0;
      this._generateDescription();
      this.data.system.equipped = true;
      this.data.system.rarity = "";
      this.data.system.identified = true;
      this._generateRange();
      this._generateAttackType();
      this._generateWeaponType();
      this._generateLimitedUse();
      this._generateProperties();
      this._generateSystemType(this.type);
      this._generateSystemSubType();
      this._generateActivity();

      this._generateFlagHints();
      this._generateResourceFlags();
      this._addEffects();

      this._addCustomValues();

    } catch (err) {
      logger.warn(
        `Unable to Generate Attack Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
