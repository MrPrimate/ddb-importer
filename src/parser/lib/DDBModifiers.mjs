import { DICTIONARY } from "../../config/_module.mjs";
import { logger, Utils } from "../../lib/_module.mjs";
import DDBDataUtils from "./DDBDataUtils.mjs";

export default class DDBModifiers {

  static getEffectExcludedModifiers(type, features, ac) {
    const EXCLUDED = DICTIONARY.effects.excludedModifiers;
    let modifiers = [];

    if (type !== "item") {
      // features represent core non ac features
      if (features) {
        modifiers = modifiers.concat(EXCLUDED.common, EXCLUDED.speedMonk);
        if (!["race"].includes(type)) {
          modifiers = modifiers.concat(EXCLUDED.senses, EXCLUDED.speedSet, EXCLUDED.speedBonus);
        }
      }
      // here ac represents the more exotic ac effects that set limits and change base
      modifiers = modifiers.concat(EXCLUDED.acBonus);
      if (ac) {
        modifiers = modifiers.concat(EXCLUDED.ac);
      }
    }

    // items are basically their own thing, all or nuffin
    if (type === "item") {
      modifiers = modifiers.concat(
        EXCLUDED.senses,
        EXCLUDED.common,
        EXCLUDED.abilityBonus,
        EXCLUDED.languages,
        EXCLUDED.proficiencyBonus,
        EXCLUDED.speedSet,
        EXCLUDED.speedBonus,
        EXCLUDED.speedMonk,
        EXCLUDED.ac,
        EXCLUDED.acBonus,
      );
    }
    return modifiers;
  }


  static getActiveItemModifiers(ddb, includeExcludedEffects = false) {
    // are we adding effects to items?
    const excludedModifiers = (!includeExcludedEffects)
      ? DDBModifiers.getEffectExcludedModifiers("item", true, true)
      : [];
    // get items we are going to interact on
    const modifiers = ddb.character.inventory
      .filter(
        (item) =>
          ((!item.definition.canEquip && !item.definition.canAttune && !item.definition.isConsumable) // if item just gives a thing and not potion/scroll
          || (item.isAttuned && item.equipped) // if it is attuned and equipped
          || (item.isAttuned && !item.definition.canEquip) // if it is attuned but can't equip
            || (!item.definition.canAttune && item.equipped)) // can't attune but is equipped
          && item.definition.grantedModifiers.length > 0,
      )
      .flatMap((item) => item.definition.grantedModifiers)
      .filter((mod) => !excludedModifiers.some((exMod) =>
        mod.type === exMod.type
        && (mod.subType === exMod.subType || !exMod.subType)),
      );

    return modifiers;
  }

  static getActiveItemEffectModifiers(ddb) {
    return DDBModifiers.getActiveItemModifiers(ddb, true).filter((mod) =>
      DDBModifiers.getEffectExcludedModifiers("item", true, true)
        .some((exMod) => mod.type === exMod.type
      && (mod.subType === exMod.subType || !exMod.subType)),
    );
  }

  static getModifiers(ddb, type, includeExcludedEffects = false, effectOnly = false, useUnfilteredModifiers = false) {
    // are we adding effects to documents?
    const excludedModifiers = (!includeExcludedEffects || (includeExcludedEffects && effectOnly))
      ? DDBModifiers.getEffectExcludedModifiers(type, true, true)
      : DDBModifiers.getEffectExcludedModifiers(type, false, false);
    // get items we are going to interact on
    let modifiers = [];
    const baseMods = useUnfilteredModifiers
      ? ddb.unfilteredModifiers[type]
      : ddb.character.modifiers[type];
    if (effectOnly) {
      modifiers = baseMods
        .filter((mod) => excludedModifiers.some((exMod) =>
          mod.type === exMod.type
        && (mod.subType === exMod.subType || !exMod.subType)),
        );
    } else {
      modifiers = baseMods
        .filter((mod) => !excludedModifiers.some((exMod) =>
          mod.type === exMod.type
        && (mod.subType === exMod.subType || !exMod.subType)),
        );
    }

    return modifiers;
  }

  static filterModifiers(modifiers, type, { subType = null, restriction = ["", null] } = {}) {
    return modifiers
      .flat()
      .filter(
        (modifier) =>
          modifier.type === type
          && (subType !== null ? modifier.subType === subType : true)
          && (!restriction ? true : restriction.includes(modifier.restriction)),
      );
  }

  static filterModifiersOld(modifiers, type, subType = null, restriction = ["", null]) {
    return DDBModifiers.filterModifiers(modifiers, type, { subType, restriction });
  }

  static isModClassFeature(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    return ddb.character.classes.some((klass) =>
      (classId === null
        ? true
        : (classId === klass.definition?.id || classId === klass.subclassDefinition?.id))
      && klass.classFeatures.some((feat) =>
        feat.definition.id == mod.componentId
        && feat.definition.entityTypeId == mod.componentTypeId
        && (classFeatureIds === null || classFeatureIds.includes(feat.definition.id))
        && (requiredLevel === null || feat.definition.requiredLevel >= requiredLevel)
        && (exactLevel === null || feat.definition.requiredLevel == exactLevel)
        // make sure this class feature is not replaced
        && !ddb.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == feat.definition.id),
      ));
  }

  static isModClassOption(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBDataUtils.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
    return ddb.character.options.class.some((option) =>
      // is this option actually part of the class list?
      klassFeatureIds.includes(option.componentId)
      // does this class option match a modifier?
      && ((option.componentTypeId == mod.componentTypeId && option.componentId == mod.componentId)
      || (option.definition.entityTypeId == mod.componentTypeId && option.definition.id == mod.componentId))
      // has this feature set been replaced by an optional class feature?
      && !ddb.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == option.componentId)
      // has it been chosen?
      && (
        ddb.character.choices.class.some((choice) =>
          choice.componentId == option.componentId
          && choice.componentTypeId == option.componentTypeId
          && foundry.utils.hasProperty(choice, "optionValue"),
        )
        || !ddb.character.choices.class.some((choice) =>
          choice.componentId == option.componentId
          && choice.componentTypeId == option.componentTypeId)
      ),
    );
  }

  static isModOptionalClassFeature(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBDataUtils.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
    return ddb.character.options.class.some((option) =>
      // is this option actually part of the class list?
      klassFeatureIds.includes(option.componentId)
      // does this modifier match a class option?
      && ((option.componentTypeId == mod.componentTypeId && option.componentId == mod.componentId)
        || (option.definition.entityTypeId == mod.componentTypeId && option.definition.id == mod.componentId))
      // !data.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == option.definition.id) &&
      // optional class feature
      && ddb.character.optionalClassFeatures?.some((f) => f.classFeatureId == option.componentId)
      // has it been chosen?
      && (
        ddb.character.choices.class.some((choice) =>
          choice.componentId == option.componentId
          && choice.componentTypeId == option.componentTypeId
          && choice.optionValue,
        )
        || ddb.classOptions?.some((classOption) =>
          classOption.id == option.componentId
          && classOption.entityTypeId == option.componentTypeId
          && (classId === null || classId === classOption.classId),
        )
      ),
    );
  }

  static isModOptionalClassChoice(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBDataUtils.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
    return ddb.character.choices.class.some((choice) =>
      // is this option actually part of the class list?
      // classFeatureIds.includes(choice.componentId)
      choice.componentTypeId == mod.componentTypeId
      && choice.componentId == mod.componentId
      && ddb.character.optionalClassFeatures?.some((f) =>
        f.classFeatureId == choice.componentId
        && (!f.affectedClassFeatureId || klassFeatureIds.includes(f.affectedClassFeatureId)),
      ),
    );
  }

  static isModAGrantedFeatMod(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    // const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBDataUtils.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
    const feats = [];
    ddb.character.classes.forEach((klass) => {
      const validClass = classId === null
        ? true
        : (classId === klass.definition?.id || classId === klass.subclassDefinition?.id);

      const validFeatures = klass.classFeatures.filter((feat) =>
        (classFeatureIds === null || classFeatureIds.includes(feat.definition.id))
        && (requiredLevel === null || feat.definition.requiredLevel >= requiredLevel)
        && (exactLevel === null || feat.definition.requiredLevel == exactLevel)
        // make sure this class feature is not replaced
        && !ddb.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == feat.definition.id),
      );
      if (validClass) {
        validFeatures.forEach((feature) => {
          feats.push(...(feature.definition.grantedFeats ?? []));
        });
      }
    });

    return feats.some((f) => f.featIds.includes(mod.componentId));

    // feat[]
    //   {
    //     "id": 16340,
    //     "name": "Weapon Mastery",
    //     "featIds": [
    //         1789142
    //     ]
    // }

    // modifier
    //   {
    //     "fixedValue": null,
    //     "id": "62627888",
    //     "entityId": 4,
    //     "entityTypeId": 1782728300,
    //     "type": "weapon-mastery",
    //     "subType": "sap-longsword",
    //     "dice": null,
    //     "restriction": "",
    //     "statId": null,
    //     "requiresAttunement": false,
    //     "duration": null,
    //     "friendlyTypeName": "Weapon Mastery",
    //     "friendlySubtypeName": "Sap (Longsword)",
    //     "isGranted": true,
    //     "bonusTypes": [],
    //     "value": null,
    //     "availableToMulticlass": true,
    //     "modifierTypeId": 43,
    //     "modifierSubTypeId": 1942,
    //     "componentId": 1789142,
    //     "componentTypeId": 1088085227,
    //     "tagConstraints": []
    // },


    // feats:[]
    // {
    //   "componentTypeId": 67468084,
    //   "componentId": 16340,
    //   "definition": {
    //       "id": 1789142,
    //       "entityTypeId": 1088085227,

    // options
    // "feat": [
    //   {
    //       "componentId": 1789142,
    //       "componentTypeId": 1088085227,
    //       "definition": {
    //           "id": 4496701,
    //           "entityTypeId": 258900837,
    //           "name": "Longsword (Sap)",
  }

  static isModAChosenClassMod(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBDataUtils.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
    const isClassFeature = DDBModifiers.isModClassFeature(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    // console.warn("isClassFeature", {isClassFeature, mod, klassFeatureIds, classId, requiredLevel, exactLevel});
    if (isClassFeature) return true;
    const isClassOption = DDBModifiers.isModClassOption(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    if (isClassOption) return true;
    // if it's been replaced by a class feature lets check that
    const isOptionalClassOption = DDBModifiers.isModOptionalClassFeature(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    if (isOptionalClassOption) return true;
    // new class feature choice
    const isOptionalClassChoice = DDBModifiers.isModOptionalClassChoice(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    if (isOptionalClassChoice) return true;
    // console.warn("isClassFeature2", {isClassFeature, mod, klassFeatureIds, classId, requiredLevel, exactLevel, isClassOption, isOptionalClassOption, isOptionalClassChoice});
    const isFeatMod = DDBModifiers.isModAGrantedFeatMod(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    return isFeatMod;
  }

  static getChosenTypeModifiers(ddb, { type = "class", includeExcludedEffects = false, effectOnly = false, classId = null, requiredLevel = null, exactLevel = null, availableToMulticlass = null, useUnfilteredModifiers = null, filterOnFeatureIds = [] } = {}) {
    const classFeatureIds = DDBDataUtils.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel })
      .filter((id) => {
        if (filterOnFeatureIds.length === 0) return true;
        return filterOnFeatureIds.includes(id);
      });
    // get items we are going to interact on
    // console.warn("getChosenTypeModifiers", {
    //   mods: DDBModifiers.getModifiers(ddb, type, includeExcludedEffects, effectOnly, useUnfilteredModifiers),
    //   classFeatureIds,
    // });
    const modifiers = DDBModifiers
      .getModifiers(ddb, type, includeExcludedEffects, effectOnly, useUnfilteredModifiers)
      .filter((mod) =>
        (
          availableToMulticlass === null
          || mod.availableToMulticlass === undefined
          || mod.availableToMulticlass === null
          || mod.availableToMulticlass === availableToMulticlass
        )
        && DDBModifiers.isModAChosenClassMod(ddb, mod, { classFeatureIds, classId, requiredLevel, exactLevel }),
      );

    // console.warn("getChosenClassModifiers", {classFeatureIds, modifiers});
    return modifiers;
  }

  static getChosenClassModifiers(ddb, { includeExcludedEffects = false, effectOnly = false, classId = null, requiredLevel = null, exactLevel = null, availableToMulticlass = null, useUnfilteredModifiers = null, filterOnFeatureIds = [] } = {}) {
    return DDBModifiers.getChosenTypeModifiers(ddb, {
      type: "class",
      includeExcludedEffects,
      effectOnly,
      classId,
      requiredLevel,
      exactLevel,
      availableToMulticlass,
      useUnfilteredModifiers,
      filterOnFeatureIds,
    });
  }

  static filterBaseCharacterModifiers(ddb, type, { subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false, classId = null, availableToMulticlass = null, useUnfilteredModifiers = null } = {}) {
    const modifiers = [
      DDBModifiers.getChosenClassModifiers(ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers }),
      DDBModifiers.getModifiers(ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getModifiers(ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
    ];

    return DDBModifiers.filterModifiersOld(modifiers, type, subType, restriction);
  }

  static getAllModifiers(ddb, { includeExcludedEffects = false, effectOnly = false, classId = null, availableToMulticlass = null, useUnfilteredModifiers = null } = {}) {
    return [
      DDBModifiers.getChosenClassModifiers(ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers }),
      DDBModifiers.getModifiers(ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getModifiers(ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getActiveItemModifiers(ddb, includeExcludedEffects),
    ].flat();
  }

  // I need to getChosenOriginFeatures from data.optionalOriginFeatures

  static filterBaseModifiers(ddb, type, { subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false, classId = null, availableToMulticlass = null, useUnfilteredModifiers = null } = {}) {
    const modifiers = [
      DDBModifiers.getChosenClassModifiers(ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers }),
      DDBModifiers.getModifiers(ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getModifiers(ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBModifiers.getActiveItemModifiers(ddb, includeExcludedEffects),
    ];

    return DDBModifiers.filterModifiersOld(modifiers, type, subType, restriction);
  }

  /**
   * Given a list of modifiers, sums up the bonus value and returns
   * a string representation of the result. May include a dice string.
   * @param {object[]} modifiers modifiers to sum up
   * @param {object} character character to get ability modifiers from
   * @returns {string} a string representation of the sum of modifiers
   */
  static getModifierSum(modifiers, character) {
    let sum = "";
    let diceString = "";
    let modBonus = 0;
    modifiers.forEach((modifier) => {
      const die = modifier.dice ?? modifier.die ?? undefined;
      const fixedBonus = die?.fixedValue ?? 0;
      const statBonus = (Number.isInteger(modifier.statId))
        ? modifier.statId
        : Number.isInteger(modifier.abilityModifierStatId)
          ? modifier.abilityModifierStatId
          : null;
      if (Number.isInteger(statBonus)) {
        const ability = DICTIONARY.actor.abilities.find((ability) => ability.id === modifier.statId);
        modBonus += character.system.abilities[ability.value].mod;
      }
      if (die) {
        const mod = die.diceString;
        diceString += diceString === "" ? mod : " + " + mod;
        if (die.diceString) {
          const mod = die.diceString + modBonus + fixedBonus;
          diceString += diceString === "" ? mod : " + " + mod;
        } else if (fixedBonus) {
          sum = Utils.stringIntAdder(sum, fixedBonus + modBonus);
        }
      } else if (modifier.fixedValue) {
        sum = Utils.stringIntAdder(sum, modifier.fixedValue);
      } else if (modifier.value) {
        sum = Utils.stringIntAdder(sum, modifier.value);
      } else if (modBonus !== 0) {
        sum = Utils.stringIntAdder(sum, modBonus);
      }
      if (modifier.modifierTypeId === 1 && modifier.bonusTypes.includes(1)) {
        // prof bonus
        sum = Utils.stringIntAdder(sum, character.system.attributes.prof);
      }

    });
    if (diceString !== "") {
      sum = diceString + " + " + sum;
    }

    sum = `${sum}`.trim().replace(/\+\s*\+/, "+").replace(/^\+\s*/, "");

    return sum !== "" ? sum : 0;
  }

  static extractModifierValue(modifier) {
    let value = "";
    let modBonus = "";

    let statBonus = (modifier.statId)
      ? modifier.statId
      : modifier.abilityModifierStatId
        ? modifier.abilityModifierStatId
        : null;

    if (statBonus) {
      const ability = DICTIONARY.actor.abilities.find((ability) => ability.id === modifier.statId).value;
      modBonus = modBonus === "" ? `@abilities.${ability}.mod` : `${modBonus} + @abilities.${ability}.mod`;
    }

    if (modifier.modifierTypeId === 1 && modifier.bonusTypes.includes(1)) {
      // prof bonus
      modBonus = modBonus === "" ? `@prof` : `${modBonus} + @prof`;
    }

    const die = modifier.dice ? modifier.dice : modifier.die ? modifier.die : undefined;

    if (die) {
      const fixedBonus = die.fixedValue ? ` + ${die.fixedValue}` : "";
      if (die.diceString) {
        value = die.diceString + modBonus + fixedBonus;
      } else if (fixedBonus) {
        value = fixedBonus + modBonus;
      }
    } else if (modifier.fixedValue) {
      value = modifier.fixedValue;
    } else if (modifier.value) {
      value = modifier.value;
    } else if (modBonus) {
      value = modBonus;
    }

    if (value === "" && modifier.subType == "saving-throws" && modifier.bonusTypes.includes(2)) {
      // we set the value to zero and when the saving throw is calculated it will
      // be updated by the attunedItemsBonus function above
      value = "@attributes.attunement.value";
    }

    return value;
  }

  static getValueFromModifiers(modifiers, name, modifierSubType, modifierType = "bonus") {
    let bonuses;
    const bonusEffects = DDBModifiers.filterModifiersOld(modifiers, modifierType, modifierSubType, null);

    if (bonusEffects.length > 0) {
      logger.debug(`Generating ${modifierSubType} ${modifierType} for ${name}`);
      bonuses = "";
      bonusEffects.forEach((modifier) => {
        let bonusParse = DDBModifiers.extractModifierValue(modifier);
        if (bonuses !== "") bonuses += " + ";
        bonuses += bonusParse;
      });
      if (bonuses === "") {
        bonuses = undefined;
        logger.debug(`Modifier value 0 for ${modifierSubType} ${modifierType} for ${name}. Reset to undefined`, {
          modifiers,
          name,
          modifierSubType,
          modifierType,
        });
      } else {
        logger.debug(`Modifier value string for ${modifierSubType} ${modifierType} for ${name}`, bonuses);
      }
    }

    return bonuses;
  }

}
