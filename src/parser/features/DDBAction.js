import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBBaseFeature from "./DDBBaseFeature.js";
import { DDBFeatureActivity } from "./DDBFeatureActivity.js";


export default class DDBAction extends DDBBaseFeature {



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
    // if (this.documentType === "weapon") return;
    if (this.ddbData.character.actions.class.some((a) =>
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

    const damage = super.getDamage(bonuses.concat([modBonus]));

    if (damage.number || damage.custom.enabled) {
      return damage;
    } else {
      return undefined;
    }
  }

  _generateDamage() {
    const damage = this.getDamage();
    if (!damage) return;
    this.data.system.damage = {
      base: damage,
      versatile: "",
    };
  }

  _generateSaveAttack() {
    this.data.system.actionType = "save";
    this._generateDamage();

    const saveActivity = new DDBFeatureActivity({
      name: this.data.name,
      type: "save",
      ddbFeature: this,
    });

    saveActivity.build({
      generateSave: true,
    });

    this.activities.push(saveActivity);
  }

  _generateMartialArtsDamage() {
    const damageType = DICTIONARY.actions.damageType.find((type) => type.id === this.ddbDefinition.damageTypeId).name;
    const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");

    let damageBonus = DDBHelper.filterBaseModifiers(this.ddbData, "damage", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + cur.value, 0);
    if (damageBonus === 0) {
      damageBonus = "";
    } else {
      damageBonus = ` + ${damageBonus}`;
    }
    const actionDie = this.ddbDefinition.dice ? this.ddbDefinition.dice : this.ddbDefinition.die ? this.ddbDefinition.die : undefined;

    // are we dealing with martial arts?
    if (this.isMartialArtist()) {
      const dies = this.ddbData.character.classes
        .filter((klass) => this.isMartialArtist(klass))
        .map((klass) => {
          const feature = klass.classFeatures.find((feature) => feature.definition.name === "Martial Arts");
          const levelScaleDie = feature?.levelScale?.dice ? feature.levelScale.dice : feature?.levelScale.die ? feature.levelScale.die : undefined;

          if (levelScaleDie?.diceString) {

            const scaleValueLink = DDBHelper.getScaleValueLink(this.ddbData, feature);
            const scaleString = scaleValueLink && scaleValueLink !== "{{scalevalue-unknown}}"
              ? scaleValueLink
              : levelScaleDie.diceString;

            if (actionDie?.diceValue > levelScaleDie.diceValue) {
              return actionDie.diceString;
            }
            return scaleString;
          } else if (actionDie !== null && actionDie !== undefined) {
            // On some races bite is considered a martial art, damage
            // is different and on the action itself
            return actionDie.diceString;
          } else {
            return "1";
          }
        });
      const die = dies.length > 0 ? dies[0] : "";
      const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
      const damageString = die.includes("@")
        ? `${die}${damageTag}${damageBonus} + @mod`
        : utils.parseDiceString(die, `${damageBonus} + @mod`, damageTag).diceString;

      // set the weapon damage
      this.data.system.damage = {
        parts: [[damageString, damageType]],
        versatile: "",
      };
    } else if (actionDie !== null && actionDie !== undefined) {
      // The Lizardfolk jaws have a different base damage, its' detailed in
      // dice so lets capture that for actions if it exists
      const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
      const damageString = utils.parseDiceString(actionDie.diceString, `${damageBonus} + @mod`, damageTag).diceString;
      this.data.system.damage = {
        parts: [[damageString, damageType]],
        versatile: "",
      };
    } else {
      // default to basics
      this.data.system.damage = {
        parts: [[`1${damageBonus} + @mod`, damageType]],
        versatile: "",
      };
    }
  }

  _calculateActionAttackAbilities() {
    let defaultAbility = this.ddbDefinition.abilityModifierStatId
      ? DICTIONARY.character.abilities.find(
        (stat) => stat.id === this.ddbDefinition.abilityModifierStatId,
      ).value
      : "";

    if (this.ddbDefinition.abilityModifierStatId
      && !([1, 2].includes(this.ddbDefinition.abilityModifierStatId) && this.ddbDefinition.isMartialArts)
    ) {
      this.data.system.ability = defaultAbility;
    } else if (this.ddbDefinition.isMartialArts) {
      this.data.system.ability
        = this.ddbDefinition.isMartialArts && this.isMartialArtist()
          ? this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.dex.value >= this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.str.value
            ? "dex"
            : "str"
          : defaultAbility !== "" ? defaultAbility : "str";
    } else {
      this.data.system.ability = "";
    }
    if (this.ddbDefinition.isMartialArts) {
      this._generateMartialArtsDamage();
      this.data.system.attack.bonus = DDBHelper.filterBaseModifiers(this.ddbData, "bonus", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + cur.value, 0);
    } else {
      this._generateDamage();
    }
    return this.data;
  }


  _generateAttackType() {
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (typeof this.ddbDefinition.saveStatId === "number") {
      this._generateSaveAttack();
    } else if (this.ddbDefinition.actionType === 1) {
      if (this.ddbDefinition.attackTypeRange === 2) {
        this.data.system.actionType = "rwak";
      } else {
        this.data.system.actionType = "mwak";
      }
      this._calculateActionAttackAbilities();
    } else {
      if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 1) {
        this.data.system.actionType = "mwak";
      } else if (this.ddbDefinition.rangeId && this.ddbDefinition.rangeId === 2) {
        this.data.system.actionType = "rwak";
      } else {
        this.data.system.actionType = "other";
      }
      this._calculateActionAttackAbilities();
    }
  }

  /**
   * Some features have actions that use dice and mods that are defined on the character class feature
   * this attempts to parse out the damage dice and any ability modifier.
   * This relies on the parsing of templateStrings for the ability modifier detection.
   */
  _generateLevelScaleDice(useScale = true) {
    if (useScale) return;
    const parts = this.ddbData.character.classes
      .filter((cls) => cls.classFeatures.some((feature) =>
        feature.definition.id == this.ddbDefinition.componentId
        && feature.definition.entityTypeId == this.ddbDefinition.componentTypeId
        && feature.levelScale?.dice?.diceString,
      ))
      .map((cls) => {
        const feature = cls.classFeatures.find((feature) =>
          feature.definition.id == this.ddbDefinition.componentId
          && feature.definition.entityTypeId == this.ddbDefinition.componentTypeId,
        );
        const parsedString = this.rawCharacter.flags.ddbimporter.dndbeyond.templateStrings.find((templateString) =>
          templateString.id == this.ddbDefinition.id
          && templateString.entityTypeId == this.ddbDefinition.entityTypeId,
        );
        const die = feature.levelScale.dice ? feature.levelScale.dice : feature.levelScale.die ? feature.levelScale.die : undefined;
        const scaleValueLink = DDBHelper.getScaleValueString(this.ddbData, this.ddbDefinition).value;
        let part = useScale && !this.excludedScale && scaleValueLink && scaleValueLink !== "{{scalevalue-unknown}}"
          ? scaleValueLink
          : die.diceString;
        if (parsedString) {
          const modifier = parsedString.definitions.find((definition) => definition.type === "modifier");
          if (modifier) {
            this.data.system.ability = modifier.subType;
            part = `${part} + @mod`;
          }
        }
        return [part, ""];
      });

    if (parts.length > 0 && !this.levelScaleInfusion) {
      const combinedParts = foundry.utils.hasProperty(this.data, "data.damage.parts") && this.data.system.damage.parts.length > 0
        ? this.data.system.damage.parts.concat(parts)
        : parts;
      this.data.system.damage = {
        parts: combinedParts,
        versatile: "",
      };
    }
  }

  _generateWeaponType() {
    if (this.documentType === "weapon") {
      const entry = DICTIONARY.actions.attackTypes.find((type) => type.attackSubtype === this.ddbDefinition.attackSubtype);
      const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === this.ddbDefinition.attackTypeRange);
      this.data.system.type.value = entry
        ? entry.value
        : range
          ? `simple${range.value}`
          : "simpleM";
    }
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
      this._generateResourceConsumption();
      this._generateRange();
      this._generateAttackType();

      // TODO: evaluate activities here

      if (this.data.system.damage.parts.length === 0) {
        logger.debug("Running level scale parser");
        this._generateLevelScaleDice();
      }

      this._generateFlagHints();
      this._generateResourceFlags();

      this._addEffects();
      this._addCustomValues();

      this.data.activities = this.activities.map((activity) => activity.data);
    } catch (err) {
      logger.warn(
        `Unable to Generate Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
