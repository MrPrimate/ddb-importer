import { DICTIONARY } from "../../config/_module.mjs";
import { utils, logger } from "../../lib/_module.mjs";
import { DDBDataUtils, DDBModifiers } from "../lib/_module.mjs";
import DDBFeatureMixin from "./DDBFeatureMixin.js";

export default class DDBAction extends DDBFeatureMixin {

  static KEEP_ACTIONS = DICTIONARY.parsing.actions.KEEP_ACTIONS;

  static KEEP_ACTIONS_STARTSWITH = DICTIONARY.parsing.actions.KEEP_ACTIONS_STARTSWITH;

  static KEEP_ACTIONS_2024 = DICTIONARY.parsing.actions.KEEP_ACTIONS_2024;

  static SKIPPED_2014_ONLY_ACTIONS = DICTIONARY.parsing.actions.SKIPPED_2014_ONLY_ACTIONS;

  static SKIPPED_2024_ONLY_ACTIONS = DICTIONARY.parsing.actions.SKIPPED_2024_ONLY_ACTIONS;

  static HIGHEST_LEVEL_ONLY_ACTION_MATCH = DICTIONARY.parsing.actions.HIGHEST_LEVEL_ONLY_ACTION_MATCH;

  _init() {
    this.isAction = true;
    logger.debug(`Generating Action ${this.ddbDefinition.name}`);
  }

  displayAsAttack() {
    const customDisplay = this.rawCharacter
      ? DDBDataUtils.getCustomValueFromCharacter(this.ddbDefinition, this.rawCharacter, 16)
      : DDBDataUtils.getCustomValue(this.ddbDefinition, this.ddbData, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (foundry.utils.hasProperty(this.ddbDefinition, "displayAsAttack")) {
      return this.ddbDefinition.displayAsAttack;
    } else {
      return false;
    }
  }

  _generateSystemType(typeNudge = null) {
    if (this.documentType === "weapon") {
      this._generateWeaponType();
    } else if (this.ddbData.character.actions.class.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      if (!this.type) this.type = "class";
      this.data.system.type.value = "class";
    } else if (this.ddbData.character.actions.race.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      if (!this.type) this.type = "race";
      this.data.system.type.value = "race";
    } else if (this.ddbData.character.actions.feat.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      if (!this.type) this.type = "feat";
      this.data.system.type.value = "feat";
    } else if (typeNudge) {
      if (!this.type) this.type = typeNudge;
      this.data.system.type.value = typeNudge;
      foundry.utils.setProperty(this.data, "flags.ddbimporter.type", typeNudge);
    }
  }

  isMeleeOrRangedAction() {
    return this.ddbDefinition.attackTypeRange || this.ddbDefinition.rangeId;
  }

  getDamage(bonuses = []) {
    // when the action type is not set to melee or ranged we don't apply the mod to damage
    const meleeOrRangedAction = this.isMeleeOrRangedAction();
    const modBonus = (this.ddbDefinition.statId || this.ddbDefinition.abilityModifierStatId)
      && !this.ddbDefinition.isOffhand
      && meleeOrRangedAction
      ? " + @mod"
      : "";
    const unarmedDamageBonus = DDBModifiers.filterBaseModifiers(this.ddbData, "damage", { subType: "unarmed-attacks" })
      .reduce((prev, cur) => prev + cur.value, 0);

    const damage = this.ddbDefinition.isMartialArts
      ? super.getMartialArtsDamage(bonuses.concat((unarmedDamageBonus === 0 ? [] : [`+ ${unarmedDamageBonus}`])))
      : super.getDamage(bonuses.concat([modBonus]));

    if (damage.number || damage.custom.enabled) {
      return damage;
    } else {
      return undefined;
    }
  }

  getActionAttackAbility() {
    let defaultAbility = this.ddbDefinition.abilityModifierStatId
      ? DICTIONARY.actor.abilities.find(
        (stat) => stat.id === this.ddbDefinition.abilityModifierStatId,
      ).value
      : "";

    if (this.ddbDefinition.abilityModifierStatId
      && !([1, 2].includes(this.ddbDefinition.abilityModifierStatId) && this.ddbDefinition.isMartialArts)
    ) {
      return defaultAbility;
    } else if (this.ddbDefinition.isMartialArts) {
      return this.ddbDefinition.isMartialArts && this.isMartialArtist()
        ? this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.dex.value >= this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.str.value
          ? "dex"
          : "str"
        : defaultAbility !== ""
          ? defaultAbility
          : "str";
    } else {
      return "";
    }
  }

  getBonusDamage() {
    if (this.ddbDefinition.isMartialArts) {
      return DDBModifiers.filterBaseModifiers(this.ddbData, "bonus", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + cur.value, 0);
    }
    return "";
  }

  _generateProperties() {
    const kiEmpowered = this.ddbData.character.classes
      // is a martial artist
      .some((cls) =>
        cls.classFeatures.some((feature) =>
          feature.definition.name === "Ki-Empowered Strikes"
          && cls.level >= feature.definition.requiredLevel,
        ));

    if (kiEmpowered && foundry.utils.getProperty(this.data, "flags.ddbimporter.originalName") == "Unarmed Strike") {
      utils.addToProperties(this.data.system.properties, "mgc");
    }
  }

  async build() {
    try {
      if (this.is2014 && DDBAction.SKIPPED_2014_ONLY_ACTIONS.includes(this.originalName)) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.skip", true);
      } else if (!this.is2014 && DDBAction.SKIPPED_2024_ONLY_ACTIONS.includes(this.originalName)) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.skip", true);
      }
      this._generateSystemType();
      this._generateSystemSubType();
      this._generateDescription();
      this._generateLimitedUse();
      this._generateRange();

      await this._generateSummons();
      await this._generateCompanions();

      if (!this.enricher.stopDefaultActivity)
        await this._generateActivity();
      await this.enricher.addAdditionalActivities(this);
      this._generateResourceFlags();

      this.cleanup();
      await this.enricher.addDocumentAdvancements();
      await this.enricher.addDocumentOverride();
      await this._addEffects(undefined, this.type);
      this._addCustomValues();

      this._final();
      await this.enricher.cleanup();

    } catch (err) {
      logger.warn(
        `Unable to Generate Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
