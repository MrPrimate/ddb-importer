import { DirectoryPicker } from "./lib/DirectoryPicker.js";
import DICTIONARY from "./dictionary.js";
import logger from "./logger.js";
import { getEffectExcludedModifiers } from "./effects/effects.js";

const existingFiles = new Set();

const utils = {
  debug: () => {
    return true;
  },

  stripHtml: (html) => {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  },

  replaceHtmlSpaces: (str) => {
    return str.replace(/&nbsp;/g, ' ').replace(/\xA0/g, ' ').replace(/\s\s+/g, ' ').trim();
  },

  renderLesserString: (str) => {
    return utils.replaceHtmlSpaces(utils.stripHtml(str)).trim().toLowerCase();
  },

  stringKindaEqual(a, b) {
    return utils.renderLesserString(a) === utils.renderLesserString(b);
  },

  getDamageType: (data) => {
    if (data.definition.damageType) {
      const damageTypeReplace = data.definition.grantedModifiers.find((mod) =>
        mod.type === "replace-damage-type" &&
        (!mod.restriction || mod.restriction === "")
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
    const damageTagData = utils.globalDamageTagInfo(mod);
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
    const damageTagData = utils.getDamageTag(mod);
    return damageTagData;
  },

  getDamageTagForItem(data) {
    const damageType = utils.getDamageType(data);
    const damageTagData = utils.getDamageTag({}, damageType);
    return damageTagData;
  },

  findByProperty: (arr, property, searchString) => {
    function levenshtein(a, b) {
      let tmp;
      if (a.length === 0) {
        return b.length;
      }
      if (b.length === 0) {
        return a.length;
      }
      if (a.length > b.length) {
        tmp = a;
        a = b;
        b = tmp;
      }

      let i,
        j,
        res,
        alen = a.length,
        blen = b.length,
        row = Array(alen);
      for (i = 0; i <= alen; i++) {
        row[i] = i;
      }

      for (i = 1; i <= blen; i++) {
        res = i;
        for (j = 1; j <= alen; j++) {
          tmp = row[j - 1];
          row[j - 1] = res;
          res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, Math.min(res + 1, row[j] + 1));
        }
      }
      return res;
    }

    const maxDistance = 3;
    let minDistance = 100;
    let nearestHit = undefined;
    let nearestDistance = minDistance;

    if (!Array.isArray(arr)) return undefined;
    arr
      .filter((entry) => Object.prototype.hasOwnProperty.call(entry, property))
      .forEach((entry) => {
        let distance = levenshtein(searchString, entry[property]);
        if (distance < nearestDistance && distance <= maxDistance && distance < minDistance) {
          nearestHit = entry;
          nearestDistance = distance;
        }
      });

    return nearestHit;
  },

  hasChosenCharacterOption: (data, optionName) => {
    const hasClassOptions = [data.character.options.race, data.character.options.class, data.character.options.feat]
      .flat()
      .some((option) => option.definition.name === optionName);
    return hasClassOptions;
  },

  getClassFromOptionID: (data, optionId) => {
    // Use case class spell - which class?
    // componentId on spells.class[0].componentId = options.class[0].definition.id
    // options.class[0].definition.componentId = classes[0].classFeatures[0].definition.id
    const option = data.character.options.class.find((option) => option.definition.id === optionId);

    if (option) {
      const klass = data.character.classes.find((klass) =>
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
      (cls.definition.id === featDefinition.classId ||
      cls.subclassDefinition?.id === featDefinition.classId) &&
      featDefinition.levelScales?.length > 0
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

    let feat = feature.levelScale ? feature : utils.findComponentByComponentId(ddb, feature.componentId);
    if (!feat && hasProperty(feature, "flags.ddbimporter.dndbeyond.choice")) {
      feat = utils.findComponentByComponentId(ddb, feature.flags.ddbimporter.dndbeyond.choice.componentId);
    }
    if (!feat && classOption) {
      feat = utils.findComponentByComponentId(ddb, classOption.componentId);
    }
    if (!feat) {
      logger.debug("no scale value for ", feature);
      return { name: undefined, value: undefined };
    }
    const useScale = game.settings.get("ddb-importer", "character-update-policy-use-scalevalue");
    const scaleSupport = utils.versionCompare(game.data.system.data.version, "1.6.0") >= 0;
    const scaleValue = useScale && scaleSupport
      ? utils.getScaleValueLink(ddb, feat)
      : utils.getExactScalingValue(feat);

    if (scaleValue) {
      return {
        name: feat.definition?.name ? feat.definition?.name : feat.name,
        value: scaleValue,
      };
    }
    // final fallback if scale value extraction fails
    return {
      name: feat.definition?.name ? feat.definition?.name : feat.name,
      value: utils.getExactScalingValue(feat),
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
          .map((source) => source.description)
          .join();
      } else if (definition.sourceId) {
        result.name = CONFIG.DDB.sources
          .filter((source) => source.id === definition.sourceId)
          .map(
            fullSource
              ? ({ description }) => description
              : ({ name }) => name
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
    const sourceData = utils.getSourceData(definition);

    let source = sourceData.name;
    if (sourceData.page) source += ` (pg. ${sourceData.page})`;

    return source;
  },

  getActiveItemModifiers: (data, includeExcludedEffects = false) => {
    // are we adding effects to items?
    const addEffects = game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
    const daeInstalled = game.modules.get("dae")?.active;
    const excludedModifiers = (addEffects && daeInstalled && !includeExcludedEffects) ? getEffectExcludedModifiers("item", true, true) : [];
    // get items we are going to interact on
    const modifiers = data.character.inventory
      .filter(
        (item) =>
          ((!item.definition.canEquip && !item.definition.canAttune && !item.definition.isConsumable) || // if item just gives a thing and not potion/scroll
          (item.isAttuned && item.equipped) || // if it is attuned and equipped
          (item.isAttuned && !item.definition.canEquip) || // if it is attuned but can't equip
            (!item.definition.canAttune && item.equipped)) && // can't attune but is equipped
          item.definition.grantedModifiers.length > 0
      )
      .flatMap((item) => item.definition.grantedModifiers)
      .filter((mod) => !excludedModifiers.some((exMod) =>
        mod.type === exMod.type &&
        (mod.subType === exMod.subType || !exMod.subType))
      );

    return modifiers;
  },

  getActiveItemEffectModifiers: (data) => {
    return utils.getActiveItemModifiers(data, true).filter((mod) =>
      getEffectExcludedModifiers("item", true, true).some((exMod) => mod.type === exMod.type &&
      (mod.subType === exMod.subType || !exMod.subType))
    );
  },

  getModifiers: (data, type, includeExcludedEffects = false, effectOnly = false) => {
    // are we adding effects to items?
    const featureEffects = game.settings.get("ddb-importer", "character-update-policy-add-character-effects");
    const acEffects = game.settings.get("ddb-importer", "character-update-policy-generate-ac-feature-effects");
    const daeInstalled = game.modules.get("dae")?.active;
    const excludedModifiers = ((featureEffects || acEffects) && daeInstalled &&
      (!includeExcludedEffects || (includeExcludedEffects && effectOnly)))
      ? getEffectExcludedModifiers(type, featureEffects, acEffects)
      : getEffectExcludedModifiers(type, false, false);
    // get items we are going to interact on
    let modifiers = [];
    if (effectOnly) {
      modifiers = data.character.modifiers[type]
        .filter((mod) => excludedModifiers.some((exMod) =>
          mod.type === exMod.type &&
        (mod.subType === exMod.subType || !exMod.subType))
        );
    } else {
      modifiers = data.character.modifiers[type]
        .filter((mod) => !excludedModifiers.some((exMod) =>
          mod.type === exMod.type &&
        (mod.subType === exMod.subType || !exMod.subType))
        );
    }

    return modifiers;
  },

  filterModifiers: (modifiers, type, subType = null, restriction = ["", null]) => {
    return modifiers
      .flat()
      .filter(
        (modifier) =>
          modifier.type === type &&
          (subType !== null ? modifier.subType === subType : true) &&
          (!restriction ? true : restriction.includes(modifier.restriction))
      );
  },

  getChosenClassModifiers: (data, includeExcludedEffects = false, effectOnly = false) => {
    // get items we are going to interact on
    const modifiers = utils.getModifiers(data, 'class', includeExcludedEffects, effectOnly).filter((mod) => {
      const isClassFeature = data.character.classes.some((klass) => klass.classFeatures.some((feat) =>
        feat.definition.id == mod.componentId && feat.definition.entityTypeId == mod.componentTypeId &&
        // make sure this class feature is not replaced
        !data.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == feat.definition.id)
      ));
      // generate a list to check in option check
      const classFeatureIds = data.character.classes.map((klass) => klass.classFeatures.map((feat) => feat.definition.id)).flat();
      const isClassOption = data.character.options.class.some((option) =>
        // does this class option match a modifier?
        ((option.componentTypeId == mod.componentTypeId && option.componentId == mod.componentId) ||
        (option.definition.entityTypeId == mod.componentTypeId && option.definition.id == mod.componentId)) &&
        // has this feature set been replacd by an optional class feature?
        !data.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == option.componentId) &&
        // has it been chosen?
        data.character.choices.class.some((choice) =>
          choice.componentId == option.componentId && choice.componentTypeId == option.componentTypeId && choice.optionValue
        ) &&
        // is this option actually part of the class list?
        classFeatureIds.includes(option.componentId)
      );
      // if it's been replaced by a class feature lets check that
      const isOptionalClassOption = data.character.options.class.some((option) =>
        ((option.componentTypeId == mod.componentTypeId && option.componentId == mod.componentId) ||
        (option.definition.entityTypeId == mod.componentTypeId && option.definition.id == mod.componentId)) &&
        // !data.character.optionalClassFeatures.some((f) => f.affectedClassFeatureId == option.definition.id) &&
        (
          data.character.choices.class.some((choice) =>
            choice.componentId == option.componentId && choice.componentTypeId == option.componentTypeId && choice.optionValue
          ) ||
          data.classOptions?.some((classOption) =>
            classOption.id == option.componentId && classOption.entityTypeId == option.componentTypeId
          )
        ) &&
        data.character.optionalClassFeatures?.some((f) => f.classFeatureId == option.componentId)
      );

      // new class feature choice
      const isOptionalClassChoice = data.character.choices.class.some((choice) =>
        choice.componentTypeId == mod.componentTypeId &&
        choice.componentId == mod.componentId &&
        data.character.optionalClassFeatures?.some((f) => f.classFeatureId == choice.componentId)
      );

      return isClassFeature || isClassOption || isOptionalClassOption || isOptionalClassChoice;
    });

    return modifiers;
  },


  filterBaseCharacterModifiers: (data, type, subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false) => {
    const modifiers = [
      utils.getChosenClassModifiers(data, includeExcludedEffects, effectOnly),
      utils.getModifiers(data, "race", includeExcludedEffects, effectOnly),
      utils.getModifiers(data, "background", includeExcludedEffects, effectOnly),
      utils.getModifiers(data, "feat", includeExcludedEffects, effectOnly),
    ];

    return utils.filterModifiers(modifiers, type, subType, restriction);
  },

  // I need to getChosenOriginFeatures from data.optionalOriginFeatures

  filterBaseModifiers: (data, type, subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false) => {
    const modifiers = [
      utils.getChosenClassModifiers(data, includeExcludedEffects, effectOnly),
      utils.getModifiers(data, "race", includeExcludedEffects, effectOnly),
      utils.getModifiers(data, "background", includeExcludedEffects, effectOnly),
      utils.getModifiers(data, "feat", includeExcludedEffects, effectOnly),
      utils.getActiveItemModifiers(data, includeExcludedEffects),
    ];

    return utils.filterModifiers(modifiers, type, subType, restriction);
  },

  /**
   * Checks the list of modifiers provided for a matching bonus type
   * and returns a sum of it's value. May include a dice string.
   * @param {*} modifiers
   * @param {*} character
   * @param {*} bonusSubType
   */
  getModifierSum: (modifiers, character) => {
    let sum = 0;
    let diceString = "";
    let modBonus = 0;
    modifiers.forEach((modifier) => {
      const die = modifier.dice ? modifier.dice : modifier.die ? modifier.die : undefined;
      const fixedBonus = die?.fixedValue ? die.fixedValue : 0;
      const statBonus = (modifier.statId)
        ? modifier.statId
        : modifier.abilityModifierStatId
          ? modifier.abilityModifierStatId
          : null;
      if (statBonus) {
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
          sum += fixedBonus + modBonus;
        }
      } else if (modifier.fixedValue) {
        sum += modifier.fixedValue;
      } else if (modifier.value) {
        sum += modifier.value;
      } else if (modBonus !== 0) {
        sum += modBonus;
      } else if (modifier.modifierTypeId === 1 && modifier.modifierSubTypeId === 218) {
        // prof bonus
        sum += character.system.attributes.prof;
      }
    });
    if (diceString !== "") {
      sum = diceString + " + " + sum;
    }

    return sum;
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
                !featDefinition.componentTypeId &&
                !featDefinition.entityTypeId &&
                id == option.componentId // && // the choice id matches the option componentID
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

  determineActualFeatureId: (data, featureId, type = "class") => {
    const optionalFeatureReplacement = data.character?.optionalClassFeatures
      ? data.character.optionalClassFeatures
        .filter((f) => f.classFeatureId === featureId)
        .map((f) => f.affectedClassFeatureId)
      : [];
    // are we dealing with an optional class feature?
    const choiceFeature = utils.getComponentIdFromOptionValue(data, type, featureId);

    if (choiceFeature) {
      const choiceOptionalFeature = data.character.optionalClassFeatures
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

  findClassByFeatureId: (data, featureId) => {
    // optional class features need this filter, as they replace existing features
    const featId = utils.determineActualFeatureId(data, featureId);
    logger.debug(`Finding featureId ${featureId} with featId ${featId}`);

    let klass = data.character.classes.find((cls) => {
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
      const option = data.character.options.class.find((option) => option.definition.id == featureId);
      if (option) {
        klass = data.character.classes.find((cls) => cls.classFeatures.find((feature) => feature.definition.id == option.componentId));
      }
      if (option && !klass && data.classOptions) {
        const classOption = data.classOptions.find((cOption) => cOption.id == option.componentId);
        if (classOption) {
          klass = data.character.classes.find((cls) => cls.definition.id === classOption.classId);
        }
      }
    }
    // class option lookups
    if (!klass && data.classOptions) {
      const classOption = data.classOptions.find((option) => option.id == featureId);
      if (classOption) {
        klass = data.character.classes.find((cls) => cls.definition.id == classOption.classId);
      }
    }
    if (klass) {
      logger.debug(`Class ${klass.definition.name} found for ${featureId} with featId ${featId}`);
    } else {
      logger.debug(`Class not found for ${featureId}`);
    }

    return klass;
  },

  calculateModifier: (val) => {
    return Math.floor((val - 10) / 2);
  },

  diceStringResultBuild: (diceMap, dice, bonus = "", mods = "", diceHint = "", specialFlags = "") => {
    const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");
    const resultBonus = bonus === 0 ? "" : `${bonus > 0 ? ' +' : ' '} ${bonus}`;
    const diceHintAdd = globalDamageHints && diceHint && diceMap;
    const hintString = diceHintAdd ? diceHint : "";
    const diceHintString = diceMap.map(({ sign, count, die }, index) =>
      `${index ? `${sign} ` : ''}${count}d${die}${specialFlags}${hintString}`
    ).join(' ');

    const result = {
      dice,
      diceMap,
      diceHintString,
      bonus,
      diceString: [
        diceHintString,
        mods,
        resultBonus
      ].join('').trim(),
    };
    return result;
  },

  parseDiceString: (inStr, mods = "", diceHint = "", specialFlags = "") => {
    // sanitizing possible inputs a bit
    const str = `${inStr}`.toLowerCase().replace(/[–-–−]/gu, "-").replace(/\s+/gu, "");

    // all found dice strings, e.g. 1d8, 4d6
    let dice = [];
    // all bonuses, e.g. -1+8
    let bonuses = [];

    const diceRegex = /(?<rawSign>[+-]*)(?<count>\d+)(?:d(?<die>\d+))?/gu;

    for (const { groups } of str.matchAll(diceRegex)) {
      const {
        rawSign = '+',
        count,
        die
      } = groups;

      // sign. We only take the sign standing exactly in front of the dice string
      // so +-1d8 => -1d8. Just as a failsave
      const sign = rawSign === "" ? "+" : rawSign.slice(-1);

      if (die) {
        dice.push({
          sign,
          count: parseInt(sign + count),
          die: parseInt(die)
        });
      } else {
        bonuses.push({
          sign,
          count: parseInt(sign + count)
        });
      }
    }

    // sum up the bonus
    const bonus = bonuses.reduce((prev, cur) => prev + cur.count, 0);

    // group the dice, so that all the same dice are summed up if they have the same sign
    // e.g.
    // +1d8+2d8 => 3d8
    // +1d8-2d8 => +1d8 -2d8 will remain as-is
    const diceMap = [];

    const groupBySign = utils.groupBy(dice, 'sign');
    for (const group of groupBySign.values()) {
      const groupByDie = utils.groupBy(group, 'die');

      for (const dieGroup of groupByDie.values()) {
        diceMap.push(
          dieGroup.reduce((acc, item) => ({
            ...acc,
            count: acc.count + item.count
          }))
        );
      }
    }

    diceMap.sort((a, b) => {
      if (a.die < b.die) return -1;
      if (a.die > b.die) return 1;
      if (a.sign === b.sign) {
        if (a.count < b.count) return -1;
        if (a.count > b.count) return 1;
        return 0;
      } else {
        return a.sign === "+" ? -1 : 1;
      }
    });

    const result = utils.diceStringResultBuild(diceMap, dice, bonus, mods, diceHint, specialFlags);
    return result;
  },

  capitalize: (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  htmlToDoc: (text) => {
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/html");
  },

  // DEVELOPMENT FUNCTION
  // loads a character.json from a file in the file system
  // loadFromFile: (filename) => {
  //   return require(`./input/${filename}.json`);
  // },

  // checks for a given file
  serverFileExists: (path) => {
    return new Promise((resolve, reject) => {
      let http = new XMLHttpRequest();
      http.open("HEAD", path);
      http.onreadystatechange = function () {
        if (this.readyState == this.DONE) {
          if (this.status >= 200 && this.status <= 399) {
            // Assume any 2xx or 3xx responses mean the image is there.
            resolve(path);
          } else {
            reject(path);
          }
        }
      };

      http.send();
    });
  },

  fileExistsUpdate: (fileList) => {
    const targetFiles = fileList.filter((f) => !existingFiles.has(f));
    for (const file of targetFiles) {
      existingFiles.add(file);
    }
  },

  generateCurrentFiles: async (directoryPath) => {
    logger.debug(`Checking for files in ${directoryPath}...`);
    const dir = DirectoryPicker.parse(directoryPath);
    const fileList = await DirectoryPicker.browse(dir.activeSource, dir.current, { bucket: dir.bucket });
    utils.fileExistsUpdate(fileList.files);
  },

  fileExists: async (directoryPath, filename) => {
    const fileUrl = await utils.getFileUrl(directoryPath, filename);
    let existingFile = existingFiles.has(fileUrl);
    if (existingFile) return true;

    logger.debug(`Checking for ${filename} at ${fileUrl}...`);
    const dir = DirectoryPicker.parse(directoryPath);
    const fileList = await DirectoryPicker.browse(dir.activeSource, dir.current, { bucket: dir.bucket });

    if (fileList.files.includes(fileUrl)) {
      logger.debug(`Found ${fileUrl}`);
      existingFiles.add(fileUrl);
      return true;
    } else {
      logger.debug(`Could not find ${fileUrl}`);
      return false;
    }
  },

  isObject: (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
  },

  mergeDeep: (target, source) => {
    let output = Object.assign({}, target);
    if (utils.isObject(target) && utils.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (utils.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = utils.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  },

  filterDeprecated: (data) => {
    for (let prop in data) {
      if (
        data[prop] &&
        Object.prototype.hasOwnProperty.call(data[prop], "_deprecated") &&
        data[prop]["_deprecated"] === true
      ) {
        delete data[prop];
      }
      if (prop === "_deprecated" && data[prop] === true) {
        delete data[prop];
      }
    }
    return data;
  },

  getTemplate: (type) => {
    const templates = game.data.template;
    for (let entityType in templates) {
      if (
        templates[entityType].types &&
        Array.isArray(templates[entityType].types) &&
        templates[entityType].types.includes(type)
      ) {
        let obj = utils.mergeDeep({}, utils.filterDeprecated(templates[entityType][type]));
        if (obj.templates) {
          obj.templates.forEach((tpl) => {
            obj = utils.mergeDeep(obj, utils.filterDeprecated(templates[entityType].templates[tpl]));
          });
          delete obj.templates;
        }
        // store the result as JSON for easy cloning
        return JSON.stringify(obj);
      }
    }
    return undefined;
  },

  convertImageToWebp: async function (file, filename) {
    logger.info(`Converting file ${filename} to webp`);

    // Load the data into an image
    const result = new Promise((resolve) => {
      let rawImage = new Image();

      rawImage.addEventListener("load", () => {
        resolve(rawImage);
      });

      rawImage.src = URL.createObjectURL(file);
    })
      .then((rawImage) => {
        // Convert image to webp ObjectURL via a canvas blob
        return new Promise((resolve) => {
          let canvas = document.createElement("canvas");
          let ctx = canvas.getContext("2d");
          const quality = game.settings.get("ddb-importer", "webp-quality");

          canvas.width = rawImage.width;
          canvas.height = rawImage.height;
          ctx.drawImage(rawImage, 0, 0);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, "image/webp", quality);
        });
      }).then((blob) => {
        return blob;
      });

    return result;
  },

  uploadFile: async function (data, path, filename, forceWebp = false) {
    const useWebP = game.settings.get("ddb-importer", "use-webp");
    const file = new File([data], filename, { type: data.type });
    const imageType = data.type.startsWith("image") && data.type !== "image/webp";
    const uploadFile = useWebP && (imageType || forceWebp)
      ? new File([await utils.convertImageToWebp(file, filename)], filename, { type: "image/webp" })
      : file;

    const result = await DirectoryPicker.uploadToPath(path, uploadFile);
    return result;
  },

  uploadImage: async function (data, path, filename, forceWebp = false) {
    return new Promise((resolve, reject) => {
      utils.uploadFile(data, path, filename, forceWebp)
        .then((result) => {
          resolve(result.path);
        })
        .catch((error) => {
          logger.error("error uploading file: ", error);
          reject(error);
        });
    });
  },

  downloadImage: async function (url) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "GET",
        headers: {
          "x-requested-with": "foundry"
        },
      })
        .then((response) => {
          if (!response.ok) {
            reject("Could not retrieve image");
          }
          return response.blob();
        })
        .then((blob) => resolve(blob))
        .catch((error) => reject(error.message));
    });
  },

  uploadRemoteImage: async function (url, targetDirectory, baseFilename, useProxy = true) {
    // prepare filenames
    const filename = baseFilename;
    const useWebP = game.settings.get("ddb-importer", "use-webp");
    const ext = useWebP
      ? "webp"
      : url
        .split(".")
        .pop()
        .split(/#|\?|&/)[0];

    try {
      const proxyEndpoint = game.settings.get("ddb-importer", "cors-endpoint");
      const urlEncode = game.settings.get("ddb-importer", "cors-encode");
      const target = urlEncode ? encodeURIComponent(url) : url;
      url = useProxy ? proxyEndpoint + target : url;
      const data = await utils.downloadImage(url);
      // hack as proxy returns ddb access denied as application/xml
      if (data.type === "application/xml") return null;
      const result = await utils.uploadImage(data, targetDirectory, filename + "." + ext);
      return result;
    } catch (error) {
      logger.error("Image upload error", error);
      ui.notifications.warn(`Image upload failed. Please check your ddb-importer upload folder setting. ${url}`);
      return null;
    }
  },

  getOrCreateFolder: async (root, entityType, folderName, folderColor = "") => {
    let folder = game.folders.contents.find((f) =>
      f.type === entityType && f.name === folderName &&
      f.parent === (root ? root.id : null)
    );
    // console.warn(`Looking for ${root} ${entityType} ${folderName}`);
    // console.warn(folder);
    if (folder) return folder;
    folder = await Folder.create(
      {
        name: folderName,
        type: entityType,
        color: folderColor,
        parent: (root) ? root.id : null,
      },
      { displaySheet: false }
    );
    return folder;
  },

  // eslint-disable-next-line no-unused-vars
  getFolder: async (kind, subFolder = "", baseFolderName = "D&D Beyond Import", baseColor = "#6f0006", subColor = "#98020a", typeFolder = true) => {
    let entityTypes = new Map();
    entityTypes.set("spell", "Item");
    entityTypes.set("equipment", "Item");
    entityTypes.set("consumable", "Item");
    entityTypes.set("tool", "Item");
    entityTypes.set("loot", "Item");
    entityTypes.set("class", "Item");
    entityTypes.set("backpack", "Item");
    entityTypes.set("magic-items", "Item");
    entityTypes.set("magic-item-spells", "Item");
    entityTypes.set("npc", "Actor");
    entityTypes.set("character", "Actor");
    entityTypes.set("extras", "Actor");
    entityTypes.set("scene", "Scene");
    entityTypes.set("page", "JournalEntry");
    entityTypes.set("journal", "JournalEntry");
    entityTypes.set("journalEntry", "JournalEntry");
    entityTypes.set("background", "Item");

    const folderName = game.i18n.localize(`ddb-importer.item-type.${kind}`);
    const entityType = entityTypes.get(kind);
    const baseFolder = await utils.getOrCreateFolder(null, entityType, baseFolderName, baseColor);
    const entityFolder = typeFolder ? await utils.getOrCreateFolder(baseFolder, entityType, folderName, subColor) : baseFolder;
    if (subFolder !== "") {
      const subFolderName = subFolder.charAt(0).toUpperCase() + subFolder.slice(1);
      const typeFolder = await utils.getOrCreateFolder(entityFolder, entityType, subFolderName, subColor);
      return typeFolder;
    } else {
      return entityFolder;
    }
  },

  normalizeString: (str) => {
    return str.toLowerCase().replace(/\W/g, "");
  },

  /**
   * Queries a compendium for a single document
   * Returns either the entry from the index, or the complete document from the compendium
   */
  queryCompendiumEntry: async (compendiumName, documentName, getDocument = false) => {
    // normalize the entity name for comparison
    documentName = utils.normalizeString(documentName);

    // get the compendium
    const compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    const index = await compendium.getIndex();

    let id = index.find((entity) => utils.normalizeString(entity.name) === documentName);
    if (id && getDocument) {
      let entity = await compendium.getDocument(id._id);
      return entity;
    }
    return id ? id : null;
  },

  /**
   * Queries a compendium for a single document
   * Returns either the entry from the index, or the complete document from the compendium
   */
  queryCompendiumEntries: async (compendiumName, documentNames, getDocuments = false) => {
    // get the compendium
    let compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    let index = await compendium.getIndex();
    index = index.map((entry) => {
      entry.normalizedName = utils.normalizeString(entry.name);
      return entry;
    });

    // get the indices of all the entitynames, filter un
    let indices = documentNames
      .map((entityName) => {
        // sometimes spells do have restricted use in paranthesis after the name. Let's try to find those restrictions and add them later
        if (entityName.search(/(.+)\(([^()]+)\)*/) !== -1) {
          const match = entityName.match(/(.+)\(([^()]+)\)*/);
          return {
            name: utils.normalizeString(match[1].trim()),
            restriction: match[2].trim(),
          };
        } else {
          return {
            name: utils.normalizeString(entityName),
            restriction: null,
          };
        }
      })
      .map((data) => {
        let entry = index.find((entity) => entity.normalizedName === data.name);
        if (entry) {
          return {
            _id: entry._id,
            name: data.restriction ? `${entry.name} (${data.restriction})` : entry.name,
          };
        } else {
          return null;
        }
      });

    if (getDocuments) {
      // replace non-null values with the complete entity from the compendium
      let entities = await Promise.all(
        indices.map((entry) => {
          return new Promise((resolve) => {
            if (entry) {
              compendium.getDocument(entry._id).then((entity) => {
                entity.name = entry.name; // transfer restrictions over, if any
                // remove redudant info
                delete entity.id;
                delete entity.ownership;
                resolve(entity);
              });
            } else {
              resolve(null);
            }
          });
        })
      );
      return entities;
    }
    return indices;
  },

  /**
   * Queries a compendium for a given document name
   * @returns the index entries of all matches, otherwise an empty array
   */
  queryCompendium: async (compendiumName, documentName, getDocument = false) => {
    documentName = utils.normalizeString(documentName);

    let compendium = game.packs.get(compendiumName);
    if (!compendium) return null;
    let index = await compendium.getIndex();
    let id = index.find((entity) => utils.normalizeString(entity.name) === documentName);
    if (id && getDocument) {
      let entity = await compendium.getEntity(id._id);
      return entity;
    }
    return id ? id : null;
  },

  getFileUrl: async (directoryPath, filename) => {
    let uri;
    try {
      let dir = DirectoryPicker.parse(directoryPath);
      if (dir.activeSource == "data") {
        // Local on-server file system
        uri = dir.current + "/" + filename;
      } else if (dir.activeSource == "forgevtt") {
        const status = ForgeAPI.lastStatus || await ForgeAPI.status();
        const userId = status.user;
        uri = "https://assets.forge-vtt.com/" + userId + "/" + dir.current + "/" + filename;
      } else {
        // S3 Bucket
        uri =
          game.data.files.s3.endpoint.protocol +
          "//" +
          dir.bucket +
          "." +
          game.data.files.s3.endpoint.hostname +
          "/" +
          dir.current +
          "/" +
          filename;
      }
    } catch (exception) {
      throw new Error(
        'Unable to determine file URL for directoryPath"' + directoryPath + '" and filename"' + filename + '"'
      );
    }
    return encodeURI(uri);
  },

  versionCompare: (v1, v2, options) => {
    var lexicographical = options && options.lexicographical,
      zeroExtend = options && options.zeroExtend,
      v1parts = v1.split("."),
      v2parts = v2.split(".");

    function isValidPart(x) {
      return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
      return NaN;
    }

    if (zeroExtend) {
      while (v1parts.length < v2parts.length) v1parts.push("0");
      while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
      v1parts = v1parts.map(Number);
      v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
      if (v2parts.length == i) {
        return 1;
      }

      if (v1parts[i] > v2parts[i]) {
        return 1;
      }
      if (v1parts[i] < v2parts[i]) {
        return -1;
      }
    }

    if (v1parts.length != v2parts.length) {
      return -1;
    }

    return 0;
  },

  groupBy(arr, property) {
    const map = new Map();

    for (const item of arr) {
      const prop = item[property];
      const group = map.get(prop) ?? [];

      group.push(item);
      map.set(prop, group);
    }

    return map;
  },

  getCustomValueFromCharacter(ddbItem, character, type) {
    if (!character) return null;
    const characterValues = character.flags.ddbimporter.dndbeyond.characterValues;
    const customValue = characterValues.filter((value) =>
      value.valueId == ddbItem.id &&
      value.valueTypeId == ddbItem.entityTypeId
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
        (value.valueId == foundryItem.flags.ddbimporter.dndbeyond?.id &&
          value.valueTypeId == foundryItem.flags.ddbimporter.dndbeyond?.entityTypeId) ||
        (value.valueId == foundryItem.flags.ddbimporter.id &&
          value.valueTypeId == foundryItem.flags.ddbimporter.entityTypeId)
    );

    if (customValue) {
      const customName = customValue.find((value) => value.typeId == type);
      if (customName) return customName.value;
    }
    return null;
  },

  addCustomValues(ddb, foundryItem) {
    // to hit override requires a lot of crunching
    // const toHitOverride = utils.getCustomValue(item, character, 13);
    const toHitBonus = utils.getCustomValue(foundryItem, ddb, 12);
    const damageBonus = utils.getCustomValue(foundryItem, ddb, 10);
    // const displayAsAttack = utils.getCustomValue(item, character, 16);
    const costOverride = utils.getCustomValue(foundryItem, ddb, 19);
    const weightOverride = utils.getCustomValue(foundryItem, ddb, 22);
    // dual wield 18
    // silvered
    const silvered = utils.getCustomValue(foundryItem, ddb, 20);
    // adamantine
    const adamantine = utils.getCustomValue(foundryItem, ddb, 21);
    // off-hand
    // const offHand = utils.getCustomValue(ddbItem, character, 18);
    const dcOverride = utils.getCustomValue(foundryItem, ddb, 15);
    const dcBonus = utils.getCustomValue(foundryItem, ddb, 14);

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

  getName(ddb, item, character = null) {
    // spell name
    const customName = character
      ? utils.getCustomValueFromCharacter(item, character, 8)
      : utils.getCustomValue(item, ddb, 8);
    if (customName) {
      return customName.replace("’", "'");
    } else if (item.definition?.name) {
      return item.definition.name.replace("’", "'");
    } else if (item.name) {
      return item.name.replace("’", "'");
    } else {
      logger.error("Unable to determine name for:", item);
      return "Unknown thing.";
    }
  },

  displayAsAttack(ddb, item, character = null) {
    const customDisplay = character
      ? utils.getCustomValueFromCharacter(item, character, 16)
      : utils.getCustomValue(item, ddb, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (hasProperty(item, "displayAsAttack")) {
      return item.displayAsAttack;
    } else {
      return false;
    }
  },

  async namePrompt(question) {
    const content = `
    <label class="text-label">
      <input type="text" name="name"/>
    </label>
  `;
    const name = await new Promise((resolve) => {
      new Dialog({
        title: question,
        content,
        buttons: {
          ok: {
            label: "Okay",
            callback: async (html) => {
              const value = html.find("input[type='text'][name='name']").val();
              resolve(value);
            },
          },
          cancel: {
            label: "Cancel",
            callback: () => {
              resolve("");
            },
          }
        },
        default: "ok",
        close: () => {
          resolve("");
        },
      }).render(true);
    });
    return name;
  }
};

export default utils;
