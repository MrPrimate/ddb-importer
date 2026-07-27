import { DICTIONARY } from "../../config/_module";
import { utils, logger } from "../../lib/_module";
import { DDBDataUtils, DDBModifiers } from "../lib/_module";
import DDBFeatureMixin from "./DDBFeatureMixin";

export default class DDBAction extends DDBFeatureMixin {

  static KEEP_ACTIONS = DICTIONARY.parsing.actions.KEEP_ACTIONS;
  static KEEP_ACTIONS_STARTSWITH = DICTIONARY.parsing.actions.KEEP_ACTIONS_STARTSWITH;
  static KEEP_ACTIONS_2024 = DICTIONARY.parsing.actions.KEEP_ACTIONS_2024;
  static SKIPPED_2014_ONLY_ACTIONS = DICTIONARY.parsing.actions.SKIPPED_2014_ONLY_ACTIONS;
  static SKIPPED_2024_ONLY_ACTIONS = DICTIONARY.parsing.actions.SKIPPED_2024_ONLY_ACTIONS;
  static HIGHEST_LEVEL_ONLY_ACTION_MATCH = DICTIONARY.parsing.actions.HIGHEST_LEVEL_ONLY_ACTION_MATCH;

  declare ddbFeature: TDDBActionTypes;
  declare ddbDefinition: TDDBActionTypes & IDDBActionBackedDefinition;

  _init() {
    this.isAction = true;
    logger.debug(`Generating Action ${this.ddbDefinition.name}`);
  }

  displayAsAttack() {
    return DDBDataUtils.displayAsAttack(this.ddbData, this.ddbDefinition, this.rawCharacter);
  }

  _generateSystemType(typeNudge: ICoreSourceTypes | null = null) {
    if (this.documentType === "weapon") {
      this._generateWeaponType();
    } else if (this.ddbData.character.actions.class.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      if (!this.type) this.type = "class";
      foundry.utils.setProperty(this.data, "system.type.value", "class");
    } else if (this.ddbData.character.actions.race.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      if (!this.type) this.type = "race";
      foundry.utils.setProperty(this.data, "system.type.value", "race");
    } else if (this.ddbData.character.actions.feat.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      if (!this.type) this.type = "feat";
      foundry.utils.setProperty(this.data, "system.type.value", "feat");
    } else if (typeNudge) {
      if (!this.type) this.type = typeNudge;
      foundry.utils.setProperty(this.data, "system.type.value", typeNudge);
      foundry.utils.setProperty(this.data, "flags.ddbimporter.type", typeNudge);
    }
  }

  isMeleeOrRangedAction() {
    return this.ddbDefinition.attackTypeRange || this.ddbDefinition.rangeId;
  }

  getDamage(bonuses: string[] = []) {
    // when the action type is not set to melee or ranged we don't apply the mod to damage
    const meleeOrRangedAction = this.isMeleeOrRangedAction();
    const modBonus = (this.ddbDefinition.statId || this.ddbDefinition.abilityModifierStatId)
      && !this.ddbDefinition.isOffhand
      && meleeOrRangedAction
      ? " + @mod"
      : "";
    const unarmedDamageBonus = DDBModifiers.filterBaseCharacterModifiers(this.ddbData, "damage", { subType: "unarmed-attacks" })
      .reduce((prev, cur) => prev + (cur.value as number), 0);

    const damage = this.ddbDefinition.isMartialArts
      ? super.getMartialArtsDamage(bonuses.concat((unarmedDamageBonus === 0 ? [] : [`+ ${unarmedDamageBonus}`])))
      : super.getDamage(bonuses.concat([modBonus]));

    if (damage.number || damage.custom?.enabled) {
      return damage;
    } else {
      // DDBFeatureMixin.getDamage is declared as always returning an I5eDamagePart, but every
      // caller (DDBFeatureMixin._generateDamage, DDBFeatureActivity) guards against a missing
      // part; widening the base signature belongs to that file's strict pass, so keep the
      // runtime undefined sentinel and satisfy the inherited signature here.
      return undefined as unknown as I5eDamagePart;
    }
  }

  getActionAttackAbility() {
    const defaultAbility = this.ddbDefinition.abilityModifierStatId
      ? DICTIONARY.actor.abilities.find(
        (stat) => stat.id === this.ddbDefinition.abilityModifierStatId,
      )?.value ?? ""
      : "";

    if (this.ddbDefinition.abilityModifierStatId
      && !([1, 2].includes(this.ddbDefinition.abilityModifierStatId) && this.ddbDefinition.isMartialArts)
    ) {
      return defaultAbility;
    } else if (this.ddbDefinition.isMartialArts) {
      const effectAbilities = this.rawCharacter.flags?.ddbimporter?.dndbeyond?.effectAbilities;
      return this.ddbDefinition.isMartialArts && this.isMartialArtist()
        ? (effectAbilities?.dex?.value ?? 0) >= (effectAbilities?.str?.value ?? 0)
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
      return DDBModifiers.filterBaseCharacterModifiers(this.ddbData, "bonus", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + (cur.value as number), 0);
    }
    return "";
  }

  _generateProperties() {
    if (!("properties" in this.data.system)) return;
    const kiEmpowered = this.ddbData.character.classes
      // is a martial artist
      .some((cls) =>
        cls.classFeatures.some((feature) =>
          feature.definition.name === "Ki-Empowered Strikes"
          && cls.level >= feature.definition.requiredLevel,
        ));

    if (kiEmpowered && foundry.utils.getProperty(this.data, "flags.ddbimporter.originalName") == "Unarmed Strike") {
      this.data.system.properties = utils.addToProperties(this.data.system.properties as TWeaponProperties[], "mgc");
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
      // DDBFeatureMixin._addEffects requires a choice, but actions have none and the base
      // handles the runtime undefined; widening the base parameter belongs to that file's
      // strict pass.
      await this._addEffects(undefined as unknown as IDDBChoiceResult, this.type);
      this._addCustomValues();

      this._final();
      await this.enricher.cleanup();

    } catch (err) {
      logger.warn(
        `Unable to Generate Action: ${this.name}, please log a bug report. Err: ${utils.errorMessage(err)}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
