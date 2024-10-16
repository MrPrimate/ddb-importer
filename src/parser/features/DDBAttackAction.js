import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBAction from "./DDBAction.js";


export default class DDBAttackAction extends DDBAction {

  static FORCE_WEAPON_FEATURES = [
    "Unarmed Strike",
    "Psychic Blades: Attack (DEX)",
    "Psychic Blades: Attack (STR)",
    "Psychic Blades: Bonus Attack (DEX)",
    "Psychic Blades: Bonus Attack (STR)",
    "Psychic Blades",
    "Thunder Gauntlets",
    "Lightning Launcher",
    "Guardian Armor: Thunder Gauntlets",
    "Guardian Armor: Thunder Gauntlets (STR)",
    "Infiltrator Armor: Lightning Launcher",
    "Infiltrator Armor: Lightning Launcher (DEX)",
    "Arcane Propulsion Armor Gauntlet",
    "Arms of the Astral Self (WIS)",
    "Arms of the Astral Self (DEX/STR)",
    "Arms of the Astral Self",
    "Bite",
    "Claw",
    "Gore",
    "Sting",
    "Talon",
    "Trunk",
    "Claws",
    "Fangs",
    "Form of the Beast: Bite",
    "Form of the Beast: Claws",
    "Form of the Beast: Tail",
    "Fanged Bite",
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
      if (!this.enricher.documentStub?.stopDefaultActivity)
        this._generateActivity();
      this.enricher.addAdditionalActivities(this);

      this._generateResourceFlags();
      this.enricher.addDocumentOverride();
      this._addEffects(undefined, this.type);

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
