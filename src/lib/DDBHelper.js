import DICTIONARY from "../dictionary.js";
import logger from "../logger.js";
import { getEffectExcludedModifiers } from "../effects/effects.js";

const DDBHelper = {

  getDamageType: (data) => {
    if (data.definition.damageType) {
      const damageTypeReplace = data.definition.grantedModifiers.find((mod) =>
        mod.type === "replace-damage-type"
        && (!mod.restriction || mod.restriction === "")
      );

      const damageType = damageTypeReplace
        ? damageTypeReplace.subType.toLowerCase()
        : data.definition.damageType.toLowerCase();
      return damageType;
    } else {
      return undefined;
    }
  },

  globalDamageTagInfo: (mod) => {
    const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");
    const midiInstalled = game.modules.get("midi-qol")?.active;
    const damageRestrictionHints = game.settings.get("ddb-importer", "add-damage-restrictions-to-hints") && !midiInstalled;
    const hintOrRestriction = globalDamageHints || damageRestrictionHints;
    const restriction = damageRestrictionHints && mod.restriction && mod.restriction !== "" ? mod.restriction : "";
    const hintAndRestriction = globalDamageHints && restriction !== "" ? " - " : "";

    return {
      globalDamageHints,
      damageRestrictionHints,
      hintOrRestriction,
      hintAndRestriction,
      restriction,
    };
  },

  getDamageTag(mod, overrideDamageType) {
    const damageTagData = DDBHelper.globalDamageTagInfo(mod);
    const damageType = overrideDamageType
      ? overrideDamageType
      : mod.subType && damageTagData.globalDamageHints ? mod.subType : "";
    const damageHint = damageTagData.hintOrRestriction
      ? `${damageType}${damageTagData.hintAndRestriction}${damageTagData.restriction}`
      : "";
    const damageTag = damageTagData.hintOrRestriction ? `[${damageHint}]` : "";
    return {
      globalDamageHints: damageTagData.globalDamageHints,
      damageRestrictionHints: damageTagData.damageRestrictionHints,
      hintOrRestriction: damageTagData.hintOrRestriction,
      hintAndRestriction: damageTagData.hintAndRestriction,
      restriction: damageTagData.restriction,
      damageType,
      damageHint,
      damageTag,
    };
  },

  getDamageTagForMod: (mod) => {
    const damageTagData = DDBHelper.getDamageTag(mod);
    return damageTagData;
  },

  getDamageTagForItem(data) {
    const damageType = DDBHelper.getDamageType(data);
    const damageTagData = DDBHelper.getDamageTag({}, damageType);
    return damageTagData;
  },

  hasChosenCharacterOption: (ddb, optionName) => {
    const hasClassOptions = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
      .flat()
      .some((option) => option.definition.name === optionName);
    return hasClassOptions;
  },

  getClassFromOptionID: (ddb, optionId) => {
    // Use case class spell - which class?
    // componentId on spells.class[0].componentId = options.class[0].definition.id
    // options.class[0].definition.componentId = classes[0].classFeatures[0].definition.id
    const option = ddb.character.options.class.find((option) => option.definition.id === optionId);

    if (option) {
      const klass = ddb.character.classes.find((klass) =>
        klass.classFeatures.some((feature) => feature.definition.id === option.componentId)
      );
      return klass;
    }
    return undefined;
  },

  /**
   * Look up a component by id
   * For now we assume that most features we are going to want to get a scaling value
   * from are character options
   * @param {*} ddb
   * @param {*} featureId
   */

  findComponentByComponentId: (ddb, componentId) => {
    let result;

    ddb.character.classes.forEach((cls) => {
      const feature = cls.classFeatures.find((component) => component.definition.id === componentId);
      if (feature) result = feature;
    });

    const optionalClassFeature = ddb.classOptions.find((option) => option.id == componentId);
    if (optionalClassFeature && !result) {
      result = optionalClassFeature;
      const optionalLevelScales = optionalClassFeature.levelScales && optionalClassFeature.levelScales.length > 0;
      if (result && !result.levelScale && optionalLevelScales) {
        const klass = ddb.character.classes.find((cls) => cls.definition.id === optionalClassFeature.classId);
        const klassLevel = klass ? klass.level : undefined;
        if (klassLevel) {
          const levelFilteredScales = optionalClassFeature.levelScales.filter((scale) => scale.level <= klassLevel);
          if (levelFilteredScales.length > 0) {
            result.levelScale = levelFilteredScales
              .reduce((previous, current) => {
                if (previous.level > current.level) return previous;
                return current;
              });
          }
        }
      }
    }

    return result;
  },

  /**
 * Gets the levelscaling value for a feature
 * @param {*} feature
 */
  getExactScalingValue: (feature) => {
    const die = feature.levelScale?.dice ? feature.levelScale.dice : feature.levelScale?.die ? feature.levelScale.die : undefined;
    if (feature && feature.levelScale && feature.levelScale.fixedValue) {
      return feature.levelScale.fixedValue;
    } else if (die) {
      return die.diceString;
    } else {
      return "{{scalevalue-unknown}}";
    }
  },

  getScaleValueLink: (ddb, feature) => {
    const featDefinition = feature.definition ? feature.definition : feature;

    const klass = ddb.character.classes.find((cls) =>
      (cls.definition.id === featDefinition.classId
      || cls.subclassDefinition?.id === featDefinition.classId)
      && featDefinition.levelScales?.length > 0
    );

    if (klass) {
      const featureName = featDefinition.name.toLowerCase().replace(/\s|'|’/g, '-');
      const klassName = klass.subclassDefinition?.id === featDefinition.classId
        ? klass.subclassDefinition.name.toLowerCase().replace(/\s|'|’/g, '-')
        : klass.definition.name.toLowerCase().replace(/\s|'|’/g, '-');
      return `@scale.${klassName}.${featureName}`;
    }

    return undefined;

  },

  getScaleValueString: (ddb, feature) => {
    const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
      .flat()
      .find((option) => option.definition.id === feature.componentId);

    let feat = feature.levelScale ? feature : DDBHelper.findComponentByComponentId(ddb, feature.componentId);
    if (!feat && hasProperty(feature, "flags.ddbimporter.dndbeyond.choice")) {
      feat = DDBHelper.findComponentByComponentId(ddb, feature.flags.ddbimporter.dndbeyond.choice.componentId);
    }
    if (!feat && classOption) {
      feat = DDBHelper.findComponentByComponentId(ddb, classOption.componentId);
    }
    if (!feat) {
      logger.debug("no scale value for ", feature);
      return { name: undefined, value: undefined };
    }
    const scaleValue = game.settings.get("ddb-importer", "character-update-policy-use-scalevalue")
      ? DDBHelper.getScaleValueLink(ddb, feat)
      : DDBHelper.getExactScalingValue(feat);

    if (scaleValue) {
      return {
        name: feat.definition?.name ? feat.definition?.name : feat.name,
        value: scaleValue,
      };
    }
    // final fallback if scale value extraction fails
    return {
      name: feat.definition?.name ? feat.definition?.name : feat.name,
      value: DDBHelper.getExactScalingValue(feat),
    };
  },

  /**
   *
   * Gets the sourcebook for a subset of dndbeyond sources
   * @param {obj} definition item definition
   */
  getSourceData: (definition) => {
    const fullSource = game.settings.get("ddb-importer", "use-full-source");
    const result = {
      name: null,
      page: null,
    };
    if (definition.sources?.length > 0) {
      result.name = CONFIG.DDB.sources
        .filter((source) => definition.sources.some((ds) => source.id === ds.sourceId))
        .map((source) => {
          const dSource = definition.sources.find((ds) => source.id === ds.sourceId);
          const page = dSource.pageNumber ? ` pg ${dSource.pageNumber}` : "";
          const sourceBook = dSource ? (fullSource ? source.description : source.name) : "Homebrew";
          return `${sourceBook}${page}`;
        })
        .join(", ");
    } else {
      if (definition.sourceIds) {
        result.name = CONFIG.DDB.sources
          .filter((source) => definition.sourceIds.includes(source.id))
          .map((source) => source.description ?? "Homebrew")
          .join();
      } else if (definition.sourceId) {
        result.name = CONFIG.DDB.sources
          .filter((source) => source.id === definition.sourceId)
          .map(
            fullSource
              ? ({ description }) => description ?? "Homebrew"
              : ({ name }) => name ?? "Homebrew"
          );
      }

      // add a page num if available
      if (definition.sourcePageNumber) result.page = definition.sourcePageNumber;
    }
    return result;
  },

  /**
   * Fetches the sources and pages for a definition
   * @param {obj} data item
   */
  parseSource: (definition) => {
    const sourceData = DDBHelper.getSourceData(definition);

    let source = sourceData.name;
    if (sourceData.page) source += ` (pg. ${sourceData.page})`;

    return source;
  },

  getActiveItemModifiers: (ddb, includeExcludedEffects = false) => {
    // are we adding effects to items?
    const addEffects = game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
    const daeInstalled = game.modules.get("dae")?.active;
    const excludedModifiers = (addEffects && daeInstalled && !includeExcludedEffects) ? getEffectExcludedModifiers("item", true, true) : [];
    // get items we are going to interact on
    const modifiers = ddb.character.inventory
      .filter(
        (item) =>
          ((!item.definition.canEquip && !item.definition.canAttune && !item.definition.isConsumable) // if item just gives a thing and not potion/scroll
          || (item.isAttuned && item.equipped) // if it is attuned and equipped
          || (item.isAttuned && !item.definition.canEquip) // if it is attuned but can't equip
            || (!item.definition.canAttune && item.equipped)) // can't attune but is equipped
          && item.definition.grantedModifiers.length > 0
      )
      .flatMap((item) => item.definition.grantedModifiers)
      .filter((mod) => !excludedModifiers.some((exMod) =>
        mod.type === exMod.type
        && (mod.subType === exMod.subType || !exMod.subType))
      );

    return modifiers;
  },

  getActiveItemEffectModifiers: (ddb) => {
    return DDBHelper.getActiveItemModifiers(ddb, true).filter((mod) =>
      getEffectExcludedModifiers("item", true, true).some((exMod) => mod.type === exMod.type
      && (mod.subType === exMod.subType || !exMod.subType))
    );
  },

  getModifiers: (ddb, type, includeExcludedEffects = false, effectOnly = false) => {
    // are we adding effects to items?
    const featureEffects = game.settings.get("ddb-importer", "character-update-policy-add-character-effects");
    const acEffects = game.settings.get("ddb-importer", "character-update-policy-generate-ac-feature-effects");
    const daeInstalled = game.modules.get("dae")?.active;
    const excludedModifiers = ((featureEffects || acEffects) && daeInstalled
      && (!includeExcludedEffects || (includeExcludedEffects && effectOnly)))
      ? getEffectExcludedModifiers(type, featureEffects, acEffects)
      : getEffectExcludedModifiers(type, false, false);
    // get items we are going to interact on
    let modifiers = [];
    if (effectOnly) {
      modifiers = ddb.character.modifiers[type]
        .filter((mod) => excludedModifiers.some((exMod) =>
          mod.type === exMod.type
        && (mod.subType === exMod.subType || !exMod.subType))
        );
    } else {
      modifiers = ddb.character.modifiers[type]
        .filter((mod) => !excludedModifiers.some((exMod) =>
          mod.type === exMod.type
        && (mod.subType === exMod.subType || !exMod.subType))
        );
    }

    return modifiers;
  },

  filterModifiers: (modifiers, type, subType = null, restriction = ["", null]) => {
    return modifiers
      .flat()
      .filter(
        (modifier) =>
          modifier.type === type
          && (subType !== null ? modifier.subType === subType : true)
          && (!restriction ? true : restriction.includes(modifier.restriction))
      );
  },

  getChosenClassModifiers: (ddb, includeExcludedEffects = false, effectOnly = false) => {
    // get items we are going to interact on
    const modifiers = DDBHelper.getModifiers(ddb, 'class', includeExcludedEffects, effectOnly).filter((mod) => {
      const isClassFeature = ddb.character.classes.some((klass) => klass.classFeatures.some((feat) =>
        feat.definition.id == mod.componentId && feat.definition.entityTypeId == mod.componentTypeId
        // make sure this class feature is not replaced
        && !ddb.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == feat.definition.id)
      ));
      // generate a list to check in option check
      const classFeatureIds = ddb.character.classes.map((klass) => klass.classFeatures.map((feat) => feat.definition.id)).flat();
      const isClassOption = ddb.character.options.class.some((option) =>
        // does this class option match a modifier?
        ((option.componentTypeId == mod.componentTypeId && option.componentId == mod.componentId)
        || (option.definition.entityTypeId == mod.componentTypeId && option.definition.id == mod.componentId))
        // has this feature set been replacd by an optional class feature?
        && !ddb.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == option.componentId)
        // has it been chosen?
        && ddb.character.choices.class.some((choice) =>
          choice.componentId == option.componentId && choice.componentTypeId == option.componentTypeId && choice.optionValue
        )
        // is this option actually part of the class list?
        && classFeatureIds.includes(option.componentId)
      );
      // if it's been replaced by a class feature lets check that
      const isOptionalClassOption = ddb.character.options.class.some((option) =>
        ((option.componentTypeId == mod.componentTypeId && option.componentId == mod.componentId)
        || (option.definition.entityTypeId == mod.componentTypeId && option.definition.id == mod.componentId))
        // !data.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == option.definition.id) &&
        && (
          ddb.character.choices.class.some((choice) =>
            choice.componentId == option.componentId && choice.componentTypeId == option.componentTypeId && choice.optionValue
          )
          || ddb.classOptions?.some((classOption) =>
            classOption.id == option.componentId && classOption.entityTypeId == option.componentTypeId
          )
        )
        && ddb.character.optionalClassFeatures?.some((f) => f.classFeatureId == option.componentId)
      );

      // new class feature choice
      const isOptionalClassChoice = ddb.character.choices.class.some((choice) =>
        choice.componentTypeId == mod.componentTypeId
        && choice.componentId == mod.componentId
        && ddb.character.optionalClassFeatures?.some((f) => f.classFeatureId == choice.componentId)
      );

      return isClassFeature || isClassOption || isOptionalClassOption || isOptionalClassChoice;
    });

    return modifiers;
  },

  filterBaseCharacterModifiers: (ddb, type, subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false) => {
    const modifiers = [
      DDBHelper.getChosenClassModifiers(ddb, includeExcludedEffects, effectOnly),
      DDBHelper.getModifiers(ddb, "race", includeExcludedEffects, effectOnly),
      DDBHelper.getModifiers(ddb, "background", includeExcludedEffects, effectOnly),
      DDBHelper.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly),
    ];

    return DDBHelper.filterModifiers(modifiers, type, subType, restriction);
  },

  // I need to getChosenOriginFeatures from data.optionalOriginFeatures

  filterBaseModifiers: (ddb, type, subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false) => {
    const modifiers = [
      DDBHelper.getChosenClassModifiers(ddb, includeExcludedEffects, effectOnly),
      DDBHelper.getModifiers(ddb, "race", includeExcludedEffects, effectOnly),
      DDBHelper.getModifiers(ddb, "background", includeExcludedEffects, effectOnly),
      DDBHelper.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly),
      DDBHelper.getActiveItemModifiers(ddb, includeExcludedEffects),
    ];

    return DDBHelper.filterModifiers(modifiers, type, subType, restriction);
  },

  stringIntAdder(one, two) {
    const oneInt = `${one}`.trim().replace(/^[+-]\s*/, "");
    const twoInt = `${two}`.trim().replace(/^[+-]\s*/, "");
    if (Number.isInteger(parseInt(oneInt)) && Number.isInteger(parseInt(twoInt))) {
      const num = parseInt(oneInt) + parseInt(twoInt);
      return `${num}`;
    } else {
      const twoAdjusted = (/^[+-]/).test(`${two}`.trim()) ? two : `+ ${two}`;
      return `${one} ${twoAdjusted}`;
    }
  },

  /**
   * Checks the list of modifiers provided for a matching bonus type
   * and returns a sum of it's value. May include a dice string.
   * @param {*} modifiers
   * @param {*} character
   * @param {*} bonusSubType
   */
  getModifierSum: (modifiers, character) => {
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
        const ability = DICTIONARY.character.abilities.find((ability) => ability.id === modifier.statId);
        modBonus += character.system.abilities[ability.value].mod;
      }
      if (die) {
        const mod = die.diceString;
        diceString += diceString === "" ? mod : " + " + mod;
        if (die.diceString) {
          const mod = die.diceString + modBonus + fixedBonus;
          diceString += diceString === "" ? mod : " + " + mod;
        } else if (fixedBonus) {
          sum = DDBHelper.stringIntAdder(sum, fixedBonus + modBonus);
        }
      } else if (modifier.fixedValue) {
        sum = DDBHelper.stringIntAdder(sum, modifier.fixedValue);
      } else if (modifier.value) {
        sum = DDBHelper.stringIntAdder(sum, modifier.value);
      } else if (modBonus !== 0) {
        sum = DDBHelper.stringIntAdder(sum, modBonus);
      } else if (modifier.modifierTypeId === 1 && modifier.modifierSubTypeId === 218) {
        // prof bonus
        sum = DDBHelper.stringIntAdder(sum, character.system.attributes.prof);
      }
    });
    if (diceString !== "") {
      sum = diceString + " + " + sum;
    }

    sum = `${sum}`.trim().replace(/\+\s*\+/, "+");

    return sum !== "" ? sum : 0;
  },

  /**
   * Searches for selected options if a given feature provides choices to the user
   * @param {string} type character property: "class", "race" etc.
   * @param {object} feat options to search for
   */
  getChoices: (ddb, type, feat) => {
    const id = feat.id ? feat.id : feat.definition.id ? feat.definition.id : null;
    const featDefinition = feat.definition ? feat.definition : feat;

    if (ddb.character.choices[type] && Array.isArray(ddb.character.choices[type])) {
      // find a choice in the related choices-array
      const choices = ddb.character.choices[type].filter(
        (characterChoice) => characterChoice.componentId && characterChoice.componentId === id
      );

      if (choices) {
        const choiceDefinitions = ddb.character.choices.choiceDefinitions;

        const options = choices
          .filter(
            (choice) => {
              const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
              const validOption = optionChoice && optionChoice.options.find((option) => option.id === choice.optionValue);
              return validOption;
            })
          .map((choice) => {
            // console.warn(choice);
            const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
            let result = optionChoice.options.find((option) => option.id === choice.optionValue);
            result.componentId = choice.componentId;
            result.componentTypeId = choice.componentTypeId;
            result.choiceId = choice.id;
            result.parentChoiceId = choice.parentChoiceId;
            result.subType = choice.subType;
            result.type = type;
            result.wasOption = false;
            return result;
          });

        if (options.length > 0) return options;

        if (ddb.character.options[type]?.length > 0) {
          // if it is a choice option, try and see if the mod matches
          const optionMatch = ddb.character.options[type]
            .filter(
              (option) =>
                // id match
                !featDefinition.componentTypeId
                && !featDefinition.entityTypeId
                && id == option.componentId // && // the choice id matches the option componentID
                // (featDefinition.componentTypeId == option.componentTypeId || // either the choice componenttype and optiontype match or
                //   featDefinition.componentTypeId == option.definition.entityTypeId) && // the choice componentID matches the option definition entitytypeid
                // option.componentTypeId == featDefinition.entityTypeId
            )
            .map((option) => {
              return {
                id: option.definition.id,
                entityTypeId: option.definition.entityTypeId,
                label: option.definition.name,
                description: option.definition.description,
                componentId: option.componentId,
                componentTypeId: option.componentTypeId,
                choiceId: null,
                sourceId: option.definition.sourceId,
                parentChoiceId: null,
                subType: `${type}-option`,
                type: type,
                wasOption: true,
              };
            });
          if (optionMatch.length > 0) return optionMatch;
        }
      }
    }
    // we could not determine if there are any choices left
    return [];
  },

  getComponentIdFromOptionValue: (ddb, type, optionId) => {
    if (ddb.character?.choices && ddb.character.choices[type] && Array.isArray(ddb.character.choices[type])) {
      // find a choice in the related choices-array
      const choice = ddb.character.choices[type].find(
        (characterChoice) => characterChoice.optionValue && characterChoice.optionValue === optionId
      );
      if (choice) return choice.componentId;
    }
    // we could not determine if there are any choices left
    return undefined;
  },

  determineActualFeatureId: (ddb, featureId, type = "class") => {
    const optionalFeatureReplacement = ddb.character?.optionalClassFeatures
      ? ddb.character.optionalClassFeatures
        .filter((f) => f.classFeatureId === featureId)
        .map((f) => f.affectedClassFeatureId)
      : [];
    // are we dealing with an optional class feature?
    const choiceFeature = DDBHelper.getComponentIdFromOptionValue(ddb, type, featureId);

    if (choiceFeature) {
      const choiceOptionalFeature = ddb.character.optionalClassFeatures
        .filter((f) => f.classFeatureId === choiceFeature)
        .map((f) => f.affectedClassFeatureId);
      if (choiceOptionalFeature && choiceOptionalFeature.length > 0) {
        return choiceOptionalFeature[0];
      }
    } else if (optionalFeatureReplacement && optionalFeatureReplacement.length > 0) {
      logger.debug(`Feature ${featureId} is replacing ${optionalFeatureReplacement[0]}`);
      return optionalFeatureReplacement[0];
    }
    return featureId;
  },

  findClassByFeatureId: (ddb, featureId) => {
    // optional class features need this filter, as they replace existing features
    const featId = DDBHelper.determineActualFeatureId(ddb, featureId);
    logger.debug(`Finding featureId ${featureId} with featId ${featId}`);

    let klass = ddb.character.classes.find((cls) => {
      let classFeatures = cls.classFeatures;
      let featureMatch = classFeatures.find((feature) => feature.definition.id === featId);

      if (featureMatch) {
        return true;
      } else {
        // if not in global class feature list lets dig down
        classFeatures = cls.definition.classFeatures;
        if (cls.subclassDefinition && cls.subclassDefinition.classFeatures) {
          classFeatures = classFeatures.concat(cls.subclassDefinition.classFeatures);
        }
        return classFeatures.some((feature) => feature.id === featId);
      }
    });
    // try class option lookup
    if (!klass) {
      const option = ddb.character.options.class.find((option) => option.definition.id == featureId);
      if (option) {
        klass = ddb.character.classes.find((cls) => cls.classFeatures.find((feature) => feature.definition.id == option.componentId));
      }
      if (option && !klass && ddb.classOptions) {
        const classOption = ddb.classOptions.find((cOption) => cOption.id == option.componentId);
        if (classOption) {
          klass = ddb.character.classes.find((cls) => cls.definition.id === classOption.classId);
        }
      }
    }
    // class option lookups
    if (!klass && ddb.classOptions) {
      const classOption = ddb.classOptions.find((option) => option.id == featureId);
      if (classOption) {
        klass = ddb.character.classes.find((cls) => cls.definition.id == classOption.classId);
      }
    }
    if (klass) {
      logger.debug(`Class ${klass.definition.name} found for ${featureId} with featId ${featId}`);
    } else {
      logger.debug(`Class not found for ${featureId}`);
    }

    return klass;
  },

  getCustomValueFromCharacter(ddbItem, character, type) {
    if (!character) return null;
    const characterValues = character.flags.ddbimporter.dndbeyond.characterValues;
    const customValue = characterValues.filter((value) =>
      value.valueId == ddbItem.id
      && value.valueTypeId == ddbItem.entityTypeId
    );

    if (customValue) {
      const value = customValue.find((value) => value.typeId == type);
      if (value) return value.value;
    }
    return null;
  },

  getCustomValue(foundryItem, ddb, type) {
    const characterValues = ddb.character?.characterValues;
    if (!characterValues) return null;
    const customValue = characterValues.filter(
      (value) =>
        (value.valueId == foundryItem.flags.ddbimporter.dndbeyond?.id
          && value.valueTypeId == foundryItem.flags.ddbimporter.dndbeyond?.entityTypeId)
        || (value.valueId == foundryItem.flags.ddbimporter.id
          && value.valueTypeId == foundryItem.flags.ddbimporter.entityTypeId)
    );

    if (customValue) {
      const customName = customValue.find((value) => value.typeId == type);
      if (customName) return customName.value;
    }
    return null;
  },

  addCustomValues(ddb, foundryItem) {
    // to hit override requires a lot of crunching
    // const toHitOverride = DDBHelper.getCustomValue(item, character, 13);
    const toHitBonus = DDBHelper.getCustomValue(foundryItem, ddb, 12);
    const damageBonus = DDBHelper.getCustomValue(foundryItem, ddb, 10);
    // const displayAsAttack = DDBHelper.getCustomValue(item, character, 16);
    const costOverride = DDBHelper.getCustomValue(foundryItem, ddb, 19);
    const weightOverride = DDBHelper.getCustomValue(foundryItem, ddb, 22);
    // dual wield 18
    // silvered
    const silvered = DDBHelper.getCustomValue(foundryItem, ddb, 20);
    // adamantine
    const adamantine = DDBHelper.getCustomValue(foundryItem, ddb, 21);
    // off-hand
    // const offHand = DDBHelper.getCustomValue(ddbItem, character, 18);
    const dcOverride = DDBHelper.getCustomValue(foundryItem, ddb, 15);
    const dcBonus = DDBHelper.getCustomValue(foundryItem, ddb, 14);

    if (toHitBonus) {
      if (hasProperty(foundryItem, "system.attackBonus") && parseInt(foundryItem.system.attackBonus) === 0) {
        foundryItem.system.attackBonus = toHitBonus;
      } else {
        foundryItem.system.attackBonus += ` + ${toHitBonus}`;
      }
    }
    if (damageBonus && foundryItem.system?.damage?.parts && foundryItem.system?.damage?.parts.length !== 0) {
      foundryItem.system.damage.parts[0][0] = foundryItem.system.damage.parts[0][0].concat(` +${damageBonus}`);
    } else if (damageBonus && foundryItem.system?.damage?.parts) {
      const part = [`+${damageBonus}`, ""];
      foundryItem.system.damage.parts.push(part);
    }
    if (costOverride) foundryItem.system.cost = costOverride;
    if (weightOverride) foundryItem.system.weight = weightOverride;
    if (silvered) foundryItem.system.properties['sil'] = true;
    if (adamantine) foundryItem.system.properties['ada'] = true;
    if (dcBonus) {
      if (foundryItem.flags.ddbimporter.dndbeyond.dc) {
        foundryItem.system.save.dc = parseInt(foundryItem.flags.ddbimporter.dndbeyond.dc) + dcBonus;
        foundryItem.system.save.scaling = "flat";
      }
    }
    if (dcOverride) {
      foundryItem.system.save.dc = dcOverride;
      foundryItem.system.save.scaling = "flat";
    }
    return foundryItem;
  },

  getName(ddb, item, character = null, allowCustom = true) {
    // spell name
    const customName = character
      ? DDBHelper.getCustomValueFromCharacter(item, character, 8)
      : DDBHelper.getCustomValue(item, ddb, 8);
    if (customName && allowCustom) {
      return customName.replace("’", "'").trim();
    } else if (item.definition?.name) {
      return item.definition.name.replace("’", "'").trim();
    } else if (item.name) {
      return item.name.replace("’", "'").trim();
    } else {
      logger.error("Unable to determine name for:", item);
      return "Unknown thing.";
    }
  },

  displayAsAttack(ddb, item, character = null) {
    const customDisplay = character
      ? DDBHelper.getCustomValueFromCharacter(item, character, 16)
      : DDBHelper.getCustomValue(item, ddb, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (hasProperty(item, "displayAsAttack")) {
      return item.displayAsAttack;
    } else {
      return false;
    }
  },

};

export default DDBHelper;
