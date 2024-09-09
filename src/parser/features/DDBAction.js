import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBBaseFeature from "./DDBBaseFeature.js";

export default class DDBAction extends DDBBaseFeature {

  static SKIPPED_ACTIONS = [
    "Cleave",
    "Graze",
    "Nick",
    "Push",
    "Sap",
    "Slow",
    "Topple",
    "Vex",
  ];

  _init() {
    this.isAction = true;
    logger.debug(`Generating Action ${this.ddbDefinition.name}`);
  }

  _prepare() {
    super._prepare();

    this._actionType = {
      class: this.ddbData.character.actions.class
        .filter((ddbAction) => DDBHelper.findClassByFeatureId(this.ddbData, ddbAction.componentId))
        .find((ddbAction) => {
          const name = DDBHelper.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
      race: this.ddbData.character.actions.race
        .some((ddbAction) => {
          const name = DDBHelper.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
      feat: this.ddbData.character.actions.feat
        .some((ddbAction) => {
          const name = DDBHelper.getName(this.ddbData, ddbAction, this.rawCharacter);
          return name === this.data.name;
        }),
    };
  }

  displayAsAttack() {
    const customDisplay = this.rawCharacter
      ? DDBHelper.getCustomValueFromCharacter(this.ddbDefinition, this.rawCharacter, 16)
      : DDBHelper.getCustomValue(this.ddbDefinition, this.ddbData, 16);
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
      this.data.system.type.value = "class";
    } else if (this.ddbData.character.actions.race.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      this.data.system.type.value = "race";
    } else if (this.ddbData.character.actions.feat.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      this.data.system.type.value = "feat";
    } else if (typeNudge) {
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
    const unarmedDamageBonus = DDBHelper.filterBaseModifiers(this.ddbData, "damage", { subType: "unarmed-attacks" })
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
      ? DICTIONARY.character.abilities.find(
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
      return DDBHelper.filterBaseModifiers(this.ddbData, "bonus", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + cur.value, 0);
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

  _generateFlagHints() {
    // obsidian and klass names (used in effect enrichment)
    if (this._actionType.class) {
      const klass = DDBHelper.findClassByFeatureId(this.ddbData, this._actionType.class.componentId);
      foundry.utils.setProperty(this.data.flags, "obsidian.source.type", "class");
      foundry.utils.setProperty(this.data.flags, "ddbimporter.type", "class");
      foundry.utils.setProperty(this.data.flags, "obsidian.source.text", klass.definition.name);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.class", klass.definition.name);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.classId", klass.definition.id);
      const subKlass = DDBHelper.findSubClassByFeatureId(this.ddbData, this._actionType.class.componentId);
      const subClass = foundry.utils.getProperty(subKlass, "subclassDefinition");
      foundry.utils.setProperty(this.data.flags, "ddbimporter.subClass", subClass?.name);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.subClassId", subClass?.id);
    } else if (this._actionType.race) {
      foundry.utils.setProperty(this.data.flags, "obsidian.source.type", "race");
      foundry.utils.setProperty(this.data.flags, "ddbimporter.type", "race");
    } else if (this._actionType.feat) {
      foundry.utils.setProperty(this.data.flags, "obsidian.source.type", "feat");
      foundry.utils.setProperty(this.data.flags, "ddbimporter.type", "feat");
    }

    // scaling details
    const klassActionComponent = DDBHelper.findComponentByComponentId(this.ddbData, this.ddbDefinition.id)
      ?? DDBHelper.findComponentByComponentId(this.ddbData, this.ddbDefinition.componentId);
    if (klassActionComponent) {
      foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScale", klassActionComponent.levelScale);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.levelScales", klassActionComponent.definition?.levelScales);
      foundry.utils.setProperty(this.data.flags, "ddbimporter.dndbeyond.limitedUse", klassActionComponent.definition?.limitedUse);
    }
  }

  build() {
    try {
      this._generateSystemType();
      this._generateSystemSubType();
      // MOVED: this._generateActivation();
      this._generateDescription();
      this._generateLimitedUse();
      this._generateRange();
      this._generateActivity();
      this.enricher.addAdditionalActivities(this);
      this._generateFlagHints();
      this._generateResourceFlags();

      this.enricher.addDocumentOverride();
      this._addEffects();
      this._addCustomValues();

    } catch (err) {
      logger.warn(
        `Unable to Generate Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
