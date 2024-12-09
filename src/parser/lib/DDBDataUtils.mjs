import { logger, utils } from "../../lib/_module.mjs";
import { SystemHelpers } from "./_module.mjs";

export default class DDBDataUtils {

  static getName(ddb, item, character = null, allowCustom = true) {
    // spell name
    const customName = character
      ? DDBDataUtils.getCustomValueFromCharacter(item, character, 8)
      : DDBDataUtils.getCustomValue(item, ddb, 8);
    if (customName && allowCustom) {
      return utils.nameString(customName);
    } else if (item.definition?.name) {
      return utils.nameString(item.definition.name);
    } else if (item.name) {
      return utils.nameString(item.name);
    } else {
      logger.error("Unable to determine name for:", item);
      return "Unknown thing.";
    }
  }

  static isComponentIdInClassFeatures(ddb, componentId, classId) {
    return ddb.character.classes
      .filter((klass) => classId === klass.definition?.id || classId === klass.subclassDefinition?.id)
      .some((klass) =>
        klass.classFeatures.some((feat) => feat.definition.id == componentId),
      );
  }

  static getClassFeatureIds(ddb, { classId = null, requiredLevel = null, exactLevel = null } = {}) {
    return ddb.character.classes
      .filter((klass) =>
        (classId === null
          ? true
          : (classId === klass.definition?.id || classId === klass.subclassDefinition?.id)),
      ).map((klass) => klass.classFeatures)
      .flat()
      .filter((feat) =>
        (requiredLevel === null || feat.definition.requiredLevel >= requiredLevel)
        && (exactLevel === null || feat.definition.requiredLevel == exactLevel),
      ).map((feat) => feat.definition.id);
  }

  static getCustomValueFromCharacter(ddbItem, character, type) {
    if (!character) return null;
    const characterValues = character.flags.ddbimporter.dndbeyond.characterValues;
    const customValue = characterValues.filter((value) =>
      value.valueId == ddbItem.id
      && value.valueTypeId == ddbItem.entityTypeId,
    );

    if (customValue) {
      const value = customValue.find((value) => value.typeId == type);
      if (value) return value.value;
    }
    return null;
  }

  static getCustomValue(foundryItem, ddb, type) {
    const characterValues = ddb.character?.characterValues;
    if (!characterValues) return null;
    const customValue = characterValues.filter(
      (value) =>
        (value.valueId == foundryItem.flags.ddbimporter.dndbeyond?.id
          && value.valueTypeId == foundryItem.flags.ddbimporter.dndbeyond?.entityTypeId)
        || (value.valueId == foundryItem.flags.ddbimporter.id
          && value.valueTypeId == foundryItem.flags.ddbimporter.entityTypeId),
    );

    if (customValue) {
      const customName = customValue.find((value) => value.typeId == type);
      if (customName) return customName.value;
    }
    return null;
  }


  static addCustomValues(ddb, foundryItem) {
    // to hit override requires a lot of crunching
    // const toHitOverride = DDBDataUtils.getCustomValue(item, character, 13);
    const toHitBonus = DDBDataUtils.getCustomValue(foundryItem, ddb, 12);
    const damageBonus = DDBDataUtils.getCustomValue(foundryItem, ddb, 10);
    // const displayAsAttack = DDBDataUtils.getCustomValue(item, character, 16);
    const costOverride = DDBDataUtils.getCustomValue(foundryItem, ddb, 19);
    const weightOverride = DDBDataUtils.getCustomValue(foundryItem, ddb, 22);
    // dual wield 18
    // silvered
    const silvered = DDBDataUtils.getCustomValue(foundryItem, ddb, 20);
    // adamantine
    const adamantine = DDBDataUtils.getCustomValue(foundryItem, ddb, 21);
    // off-hand
    // const offHand = DDBDataUtils.getCustomValue(ddbItem, character, 18);
    const dcOverride = DDBDataUtils.getCustomValue(foundryItem, ddb, 15);
    const dcBonus = DDBDataUtils.getCustomValue(foundryItem, ddb, 14);

    if (foundryItem.system.activities) {
      Object.keys(foundryItem.system.activities).forEach((id) => {
        let activity = foundryItem.system.activities[id];

        if (activity.type === "attack") {
          if (toHitBonus) {
            if (foundry.utils.hasProperty(activity, "bonus")
              && (parseInt(activity.bonus) === 0
              || activity.bonus === "")
            ) {
              activity.bonus = toHitBonus;
            } else {
              activity.bonus += ` + ${toHitBonus}`;
            }
          }
        }
        if (activity.damage && damageBonus) {
          const part = SystemHelpers.buildDamagePart({ damageString: damageBonus });
          activity.damage.parts.push(part);
        }
        if (activity.type === "save") {
          if (dcBonus) {
            if (foundryItem.flags.ddbimporter.dndbeyond.dc) {
              activity.save.dc.formula = `${parseInt(foundryItem.flags.ddbimporter.dndbeyond.dc) + dcBonus}`;
              activity.save.dc.calculation = "";
            }
          }
          if (dcOverride) {
            activity.save.dc.formula = dcOverride;
            activity.save.dc.calculation = "";
          }
        }

        foundryItem.system.activities[id] = activity;
      });
    }

    if (costOverride) foundryItem.system.cost = costOverride;
    if (weightOverride) foundryItem.system.weight = weightOverride;
    if (silvered) {
      foundryItem.system.properties = utils.addToProperties(foundryItem.system.properties, "sil");
    }
    if (adamantine) {
      foundryItem.system.properties = utils.addToProperties(foundryItem.system.properties, "ada");
    }
    return foundryItem;
  }

  static displayAsAttack(ddb, item, character = null) {
    const customDisplay = character
      ? DDBDataUtils.getCustomValueFromCharacter(item, character, 16)
      : DDBDataUtils.getCustomValue(item, ddb, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (foundry.utils.hasProperty(item, "displayAsAttack")) {
      return item.displayAsAttack;
    } else {
      return false;
    }
  }

  static hasChosenCharacterOption(ddb, optionName) {
    const hasClassOptions = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
      .flat()
      .some((option) => option.definition.name === optionName);
    return hasClassOptions;
  }

  static getClassFromOptionID(ddb, optionId) {
    // Use case class spell - which class?
    // componentId on spells.class[0].componentId = options.class[0].definition.id
    // options.class[0].definition.componentId = classes[0].classFeatures[0].definition.id
    const option = ddb.character.options.class.find((option) => option.definition.id === optionId);

    if (option) {
      const klass = ddb.character.classes.find((klass) =>
        klass.classFeatures.some((feature) => feature.definition.id === option.componentId),
      );
      return klass;
    }
    return undefined;
  }

  /**
   * Look up a component by id
   * For now we assume that most features we are going to want to get a scaling value
   * from are character options
   * @param {*} ddb
   * @param {*} featureId
   */

  static findComponentByComponentId(ddb, componentId) {
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
  }

  /**
   * Gets the levelscaling value for a feature
   * @param {*} feature
   * @returns {string}
   */
  static getExactScalingValue(feature) {
    const die = feature.levelScale?.dice ? feature.levelScale.dice : feature.levelScale?.die ? feature.levelScale.die : undefined;
    if (feature && feature.levelScale && feature.levelScale.fixedValue) {
      return feature.levelScale.fixedValue;
    } else if (die) {
      return die.diceString;
    } else {
      return "{{scalevalue-unknown}}";
    }
  }

  static getScaleValueLink(ddb, feature, flatOnly = false) {
    const featDefinition = feature.definition ? feature.definition : feature;

    const klass = ddb.character.classes.find((cls) =>
      (cls.definition.id === featDefinition.classId
      || cls.subclassDefinition?.id === featDefinition.classId)
      && featDefinition.levelScales?.length > 0
      && (!flatOnly
        || (flatOnly && featDefinition.levelScales.every((s) => s.fixedValue !== null))),
    );

    if (klass) {
      const featureName = utils.referenceNameString(featDefinition.name);
      const klassName = klass.subclassDefinition?.id === featDefinition.classId
        ? DDBDataUtils.classIdentifierName(klass.subclassDefinition.name)
        : DDBDataUtils.classIdentifierName(klass.definition.name);
      return `@scale.${klassName}.${featureName}`;
    }

    return undefined;

  }

  static getScaleValueString(ddb, feature) {
    const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
      .flat()
      .find((option) => option.definition.id === feature.componentId);

    let feat = feature.levelScale ? feature : DDBDataUtils.findComponentByComponentId(ddb, feature.componentId);
    if (!feat && foundry.utils.hasProperty(feature, "flags.ddbimporter.dndbeyond.choice")) {
      feat = DDBDataUtils.findComponentByComponentId(ddb, feature.flags.ddbimporter.dndbeyond.choice.componentId);
    }
    if (!feat && classOption) {
      feat = DDBDataUtils.findComponentByComponentId(ddb, classOption.componentId);
    }
    if (!feat) {
      logger.debug("no scale value for ", feature);
      return { name: undefined, value: undefined };
    }
    const scaleValue = DDBDataUtils.getScaleValueLink(ddb, feat);
    if (scaleValue) {
      return {
        name: feat.definition?.name ? feat.definition?.name : feat.name,
        value: scaleValue,
      };
    }
    // final fallback if scale value extraction fails
    return {
      name: feat.definition?.name ? feat.definition?.name : feat.name,
      value: DDBDataUtils.getExactScalingValue(feat),
    };
  }

  static classIdentifierName(className) {
    let result = utils.referenceNameString(className.split("(")[0].trim());
    const removals = [
      "circle-of-the-", "circle-of-",
      "path-of-the-", "path-of-",
      "warrior-of-the-", "warrior-of-",
      "oath-of-the-", "oath-of-",
      "-domain",
      "-sorcery",
      "-patron",
    ];
    for (const remove of removals) {
      if (result.includes(remove)) {
        result = result.replace(remove, "");
        break;
      }
    }

    // console.warn(`classIdentifierName: ${className} -> ${result}`);

    return result;
  }

  static hasClassFeature({ ddbData, featureName, className = null, subClassName = null } = {}) {
    const result = ddbData.character.classes.some((klass) =>
      klass.classFeatures.some((feature) => feature.definition.name === featureName && klass.level >= feature.definition.requiredLevel)
      && ((className === null || klass.definition.name === className)
        && (subClassName === null || klass.subclassDefinition?.name === subClassName)),
    );

    return result;
  }

  /**
   * Retrieves a list of character choices based on the provided parameters.
   *
   * @param {object} params The parameters for retrieving choices.
   * @param {object} params.ddb The DDB data object containing character information.
   * @param {string} params.type The type of choice to retrieve.
   * @param {object} params.feat The feature object used to identify the choice.
   * @param {boolean} [params.selectionOnly=true] Whether to return only selections.
   * @param {boolean} [params.filterByParentChoice=false] Whether to filter choices by parent choice ID.
   * @param {string|null} [params.parentChoiceId=null] The parent choice ID to filter by, if applicable.
   *
   * @returns {object[]} An array of choice objects, each representing a valid choice option.
   */
  static getChoices(
    { ddb, type, feat, selectionOnly = true, filterByParentChoice = false,
      parentChoiceId = null } = {},
  ) {
    const id = feat.id ? feat.id : feat.definition.id ? feat.definition.id : null;
    const featDefinition = feat.definition ? feat.definition : feat;

    // console.warn("getChoices", {
    //   id,
    //   type,
    //   feat,
    //   selectionOnly,
    //   featDefinition,
    // });

    if (ddb.character.choices[type] && Array.isArray(ddb.character.choices[type])) {
      // find a choice in the related choices-array
      const choices = ddb.character.choices[type].filter((characterChoice) =>
        characterChoice.componentId
        && characterChoice.componentId === id
        && (!filterByParentChoice
          || (filterByParentChoice && characterChoice.parentChoiceId === parentChoiceId)),
      );

      if (choices) {
        const choiceDefinitions = ddb.character.choices.choiceDefinitions;

        const validChoices = choices
          .filter(
            (choice) => {
              const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
              const validOption = optionChoice && optionChoice.options.find((option) => option.id === choice.optionValue);
              return validOption;
            });

        // console.warn("choices", {
        //   validChoices,
        //   choiceDefinitions,
        //   choices,
        // });

        if (!selectionOnly && validChoices.length > 0) {
          const results = [];
          for (const choice of validChoices) {
            const optionChoice = choiceDefinitions.find((selection) =>
              selection.id === `${choice.componentTypeId}-${choice.type}`,
            );
            const options = optionChoice.options
              .filter((option) => choice.optionIds.length === 0 || choice.optionIds.includes(option.id))
              .map((option) => {
                option.componentId = choice.componentId;
                option.componentTypeId = choice.componentTypeId;
                option.choiceId = choice.id;
                option.parentChoiceId = choice.parentChoiceId;
                option.subType = choice.subType;
                option.type = type;
                option.wasOption = false;
                return option;
              });
            // console.warn("validChoice Options", {
            //   choice,
            //   optionChoice,
            //   options,
            // });
            results.push(...options);
          }
          if (results.length > 0) return results;
        }

        const options = validChoices.map((choice) => {
          const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
          // console.warn("details", {
          //   choices,
          //   choice,
          //   optionChoice,
          //   choiceDefinitions,
          // });
          let result = optionChoice.options
            .filter((option) => choice.optionIds.length === 0 || choice.optionIds.includes(option.id))
            .find((option) => option.id === choice.optionValue);
          result.componentId = choice.componentId;
          result.componentTypeId = choice.componentTypeId;
          result.choiceId = choice.id;
          result.parentChoiceId = choice.parentChoiceId;
          result.subType = choice.subType;
          result.type = type;
          result.wasOption = false;
          return result;
        });

        if (options.length > 0) {
          // console.warn("returning options", {
          //   options,
          // });
          return options;
        }

        if (ddb.character.options[type]?.length > 0) {
          // if it is a choice option, try and see if the mod matches
          const optionMatch = ddb.character.options[type]
            .filter(
              (option) =>
                // id match
                (!featDefinition.componentTypeId && !featDefinition.entityTypeId && id == option.componentId)
                || (!featDefinition.componentTypeId
                  && foundry.utils.hasProperty(featDefinition, "entityTypeId")
                  && featDefinition.entityTypeId == option.componentTypeId
                  && id == option.componentId
                ),
              // && // the choice id matches the option componentID
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

          // console.warn("optionMatch", {
          //   optionMatch,
          // });
          if (optionMatch.length > 0) return optionMatch;
        }
      }
    }
    // we could not determine if there are any choices left
    return [];
  }

  static getComponentIdFromOptionValue(ddb, type, optionId) {
    if (ddb.character?.choices && ddb.character.choices[type] && Array.isArray(ddb.character.choices[type])) {
      // find a choice in the related choices-array
      const choice = ddb.character.choices[type].find(
        (characterChoice) => characterChoice.optionValue && characterChoice.optionValue === optionId,
      );
      if (choice) return choice.componentId;
    }
    // we could not determine if there are any choices left
    return undefined;
  }

  static determineActualFeatureId(ddb, featureId, type = "class") {
    const optionalFeatureReplacement = ddb.character?.optionalClassFeatures
      ? ddb.character.optionalClassFeatures
        .filter((f) => f.classFeatureId === featureId)
        .map((f) => f.affectedClassFeatureId)
      : [];
    // are we dealing with an optional class feature?
    const choiceFeature = DDBDataUtils.getComponentIdFromOptionValue(ddb, type, featureId);

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
  }

  static findSubClassByFeatureId(ddb, featureId) {
    // optional class features need this filter, as they replace existing features
    const featId = DDBDataUtils.determineActualFeatureId(ddb, featureId);
    logger.debug(`Finding subclass featureId ${featureId} with featId ${featId}`);

    let klass = ddb.character.classes.find((cls) => {
      let classFeatures = cls.definition.classFeatures;
      if (!cls.subclassDefinition) return false;
      if (!cls.subclassDefinition.classFeatures) return false;

      const subClassFeatures = cls.subclassDefinition.classFeatures.filter((f) =>
        !classFeatures.some((cf) => cf.id === f.id),
      );

      return subClassFeatures.some((feature) => feature.id === featId);
    });
    return klass;
  }

  static findClassByFeatureId(ddb, featureId) {
    // optional class features need this filter, as they replace existing features
    const featId = DDBDataUtils.determineActualFeatureId(ddb, featureId);
    logger.verbose(`Finding featureId ${featureId} with featId ${featId}`);

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
      logger.verbose(`Class ${klass.definition.name} found for ${featureId} with featId ${featId}`);
    } else {
      logger.debug(`Class not found for ${featureId}`);
    }

    return klass;
  }

  static findMatchedDDBItem(item, ownedItems, existingMatchedItems = []) {
    return ownedItems.find((owned) => {
      // have we already matched against this id? lets not double dip
      const existingMatch = existingMatchedItems.find((matched) => {
        return foundry.utils.getProperty(owned, "flags.ddbimporter.id") === foundry.utils.getProperty(matched, "flags.ddbimporter.id");
      });
      if (existingMatch) return false;
      // the simple match
      const simpleMatch
        = item.name === owned.name
        && item.type === owned.type
        && item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id;
      const definitionIdMatch
        = foundry.utils.hasProperty(item, "flags.ddbimporter.definitionId")
        && foundry.utils.hasProperty(owned, "flags.ddbimporter.id")
        && item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id
        && item.flags?.ddbimporter?.definitionId === owned.flags?.ddbimporter?.definitionId;
      // account for choices in ddb
      const isChoice
        = foundry.utils.hasProperty(item, "flags.ddbimporter.dndbeyond.choice.choiceId")
        && foundry.utils.hasProperty(owned, "flags.ddbimporter.dndbeyond.choice.choiceId");
      const choiceMatch = isChoice
        ? item.flags.ddbimporter.dndbeyond.choice.choiceId
          === owned.flags.ddbimporter.dndbeyond.choice.choiceId
        : true;
      // force an override
      const overrideDetails = foundry.utils.getProperty(owned, "flags.ddbimporter.overrideItem");
      const overrideMatch
        = overrideDetails
        && item.name === overrideDetails.name
        && item.type === overrideDetails.type
        && item.flags?.ddbimporter?.id === overrideDetails.ddbId;

      return ((simpleMatch || definitionIdMatch) && choiceMatch) || overrideMatch;
    });
  }

}
