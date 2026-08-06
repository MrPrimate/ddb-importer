import { logger, utils } from "../../lib/_module";
import { DICTIONARY } from "../../config/_module";
import SystemHelpers from "../../lib/SystemHelpers";
import DDBClass from "../classes/DDBClass";
import DDBSubClass from "../classes/DDBSubClass";
import { IResetType } from "../../config/dictionary/actor/resets";

interface IDDBDataUtilsLimitedUses {
  data: TDDBLimitedUses;
  description?: string;
  scaleValue?: string | null;
}

type TNameTypes = TDDBActionTypes | TDDBFeatureMixinDefinitions | IDDBInventoryItem;

export default class DDBDataUtils {

  static getName(ddb: IDDBData, item: TNameTypes, character: I5ePCData | null = null, allowCustom = true): string {
    // spell name
    const customName = character && allowCustom
      ? DDBDataUtils.getCustomValueFromCharacter(item, character, 8)
      ?? DDBDataUtils.getLinkedActionCustomValue(ddb, item, character, 8)
      : null;
      // : DDBDataUtils.getCustomValue(item, ddb, 8);
    if (customName) {
      return utils.nameString(String(customName));
    } else if ("definition" in item && item.definition?.name) {
      return utils.nameString(item.definition.name);
    } else if ("name" in item && item.name) {
      return utils.nameString(item.name);
    } else {
      logger.error("Unable to determine name for:", item);
      return "Unknown thing.";
    }
  }

  static isComponentIdInClassFeatures(ddb: IDDBData, componentId: number, classId: number): boolean {
    return ddb.character.classes
      .filter((klass) => classId === klass.definition?.id || classId === klass.subclassDefinition?.id)
      .some((klass) =>
        klass.classFeatures.some((feat) => feat.definition.id == componentId),
      );
  }

  static getClassFeatureIds(ddb: IDDBData, { classId = null, requiredLevel = null, exactLevel = null }: { classId?: number | null; requiredLevel?: number | null; exactLevel?: number | null } = {}): number[] {
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

  static getCustomValueFromCharacter(ddbItem: TNameTypes, character: I5ePCData, type: number) {
    if (!character) return null;
    const characterValues = character.flags?.ddbimporter?.dndbeyond?.characterValues;
    if (!characterValues) return null;
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

  /**
   * DDB attaches custom values (e.g. a renamed action) to the action entity, but most
   * documents are built from the parent feature/trait definition, which has a different
   * id and entityTypeId. Actions point back at their parent via componentId/componentTypeId,
   * so use that link to find a custom value set on the feature's action.
   */
  static getLinkedActionCustomValue(ddb: IDDBData, item: TNameTypes, character: I5ePCData, type: number) {
    const actions = ddb?.character?.actions;
    // null ids would loosely match null componentIds, so only look up real ids
    if (!actions || item.id == null || item.entityTypeId == null) return null;
    const linkedActions = Object.values(actions)
      .flat()
      .filter((action) =>
        action
        && action.componentId == item.id
        && action.componentTypeId == item.entityTypeId,
      );
    // ambiguous when a feature spawns more than one action (e.g. Breath Weapon), so skip
    if (linkedActions.length !== 1) return null;
    return DDBDataUtils.getCustomValueFromCharacter(linkedActions[0], character, type);
  }

  static getCustomValue(foundryItem: I5ePCItem, ddb: IDDBData, type: number) {
    const characterValues = ddb.character?.characterValues;
    if (!characterValues) return null;
    const ddbImporterFlags = foundryItem.flags.ddbimporter;
    if (!ddbImporterFlags) return null;
    const customValue = characterValues.filter(
      (value) =>
        (value.valueId == ddbImporterFlags.dndbeyond?.id
          && value.valueTypeId == ddbImporterFlags.dndbeyond?.entityTypeId)
        || (value.valueId == ddbImporterFlags.id
          && value.valueTypeId == ddbImporterFlags.entityTypeId),
    );

    if (customValue) {
      const customName = customValue.find((value) => value.typeId == type);
      if (customName) return customName.value;
    }
    return null;
  }

  static addCustomValues<T extends I5ePCConsumptionItems>(ddb: IDDBData, foundryItem: T): T {
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

    if ("activities" in foundryItem.system) {
      const { activities } = foundryItem.system;
      Object.keys(activities).forEach((id) => {
        const activity = activities[id];

        if (activity.type === "attack") {
          if (toHitBonus) {
            const attack = activity.attack;
            const existingBonus = attack?.bonus;
            if (attack && existingBonus
              && (parseInt(existingBonus) === 0
              || existingBonus === "")
            ) {
              attack.bonus = String(toHitBonus);
            } else if (attack && existingBonus) {
              attack.bonus += ` + ${toHitBonus}`;
            } else {
              foundry.utils.setProperty(activity, "attack.bonus", toHitBonus);
            }
          }
        }
        if ("damage" in activity && damageBonus && activity.damage?.parts) {
          const part = SystemHelpers.buildDamagePart({ damageString: String(damageBonus) });
          activity.damage.parts.push(part);
        }
        if (activity.type === "save") {
          const saveDc = activity.save.dc;
          if (dcBonus && saveDc) {
            const dc = foundry.utils.getProperty(foundryItem, "flags.ddbimporter.dndbeyond.dc") as string | undefined;
            if (dc) {
              saveDc.formula = `${dc + dcBonus}`;
              saveDc.calculation = "";
            }
          }
          if (dcOverride && saveDc) {
            saveDc.formula = String(dcOverride);
            saveDc.calculation = "";
          }
        }

        activities[id] = activity;
      });
    }

    if ("cost" in foundryItem.system && costOverride)
      foundryItem.system.cost = costOverride;
    if ("weight" in foundryItem.system && weightOverride)
      foundryItem.system.weight.value = parseInt(String(weightOverride));
    if (silvered) {
      foundryItem.system.properties = utils.addToProperties(foundryItem.system.properties, "sil");
    }
    if (adamantine) {
      foundryItem.system.properties = utils.addToProperties(foundryItem.system.properties, "ada");
    }
    return foundryItem;
  }

  static displayAsAttack(_ddb: IDDBData, item: TDDBActionTypes, character: I5ePCData | null = null) {
    const customDisplay = character
      ? DDBDataUtils.getCustomValueFromCharacter(item, character, 16)
      : null; // DDBDataUtils.getCustomValue(item, ddb, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (foundry.utils.hasProperty(item, "displayAsAttack")) {
      return item.displayAsAttack;
    } else {
      return false;
    }
  }

  static hasChosenCharacterOption(ddb: IDDBData, optionName: string): boolean {
    const hasClassOptions = [
      ...(ddb.character.options.race ?? []),
      ...(ddb.character.options.class ?? []),
      ...(ddb.character.options.feat ?? []),
    ].some((option) => option.definition.name === optionName);
    return hasClassOptions;
  }

  static getClassFromOptionID(ddb: IDDBData, optionId: number): IDDBClass | undefined {
    // Use case class spell - which class?
    // componentId on spells.class[0].componentId = options.class[0].definition.id
    // options.class[0].definition.componentId = classes[0].classFeatures[0].definition.id
    const option = ddb.character.options.class?.find((option) => option.definition.id === optionId);

    if (option) {
      const klass = ddb.character.classes.find((klass) =>
        klass.classFeatures.some((feature) => feature.definition.id === option.componentId),
      );
      return klass;
    }

    if (ddb.classOptions) {
      const option = ddb.classOptions.find((option) => option.id === optionId);
      if (option) {
        const klass = ddb.character.classes.find((cls) => cls.definition.id === option.classId)
          ?? ddb.character.classes.find((cls) => cls.subclassDefinition?.id === option.classId);
        return klass;
      }
    }

    return undefined;
  }

  static getFeatureFromOptionId(ddb: IDDBData, optionId: number, type: "race" | "class" | "feat"): IDDBRacialTrait | undefined {
    const option = ddb.character.options[type]?.find((option) => option.definition.id === optionId);

    if (!option) return undefined;

    if (type === "race") {
      const trait = ddb.character.race.racialTraits.find((component) => component.definition.id === option.componentId);
      if (trait) return trait;
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

  static findComponentByComponentId(ddb: IDDBData, componentId: number): IDDBClassFeature | IDDBRacialTrait | undefined {
    let result: IDDBClassFeature | IDDBRacialTrait | undefined = undefined;

    ddb.character.classes.forEach((cls) => {
      const feature = cls.classFeatures.find((component) => component.definition.id === componentId);
      if (feature) result = feature;
    });

    const optionalClassFeature = ddb.classOptions.find((option) => option.id == componentId);
    if (optionalClassFeature && !result) {
      // An optional class feature is a bare definition; wrap it in a synthetic
      // IDDBClassFeature so consumers see the same { definition, levelScale } shape
      // as real class features. Do not mutate the shared classOptions element.
      let levelScale: IDDBClassFeatureLevelScale | null = null;
      if (optionalClassFeature.levelScales && optionalClassFeature.levelScales.length > 0) {
        const klass = ddb.character.classes.find((cls) => cls.definition.id === optionalClassFeature.classId);
        const klassLevel = klass ? klass.level : undefined;
        if (klassLevel) {
          const levelFilteredScales = optionalClassFeature.levelScales.filter((scale) => scale.level <= klassLevel);
          if (levelFilteredScales.length > 0) {
            levelScale = levelFilteredScales
              .reduce((previous: IDDBClassFeatureLevelScale, current: IDDBClassFeatureLevelScale) => {
                if (previous.level > current.level) return previous;
                return current;
              });
          }
        }
      }
      result = { definition: optionalClassFeature, levelScale };
    }

    if (!result) {
      const trait = DDBDataUtils.getFeatureFromOptionId(ddb, componentId, "race");
      if (trait) result = trait;
    }

    return result;
  }

  /**
   * Gets the levelscaling value for a feature
   * @param {*} feature
   * @returns {string}
   */
  static getExactScalingValue(feature: { levelScale?: IDDBClassFeatureLevelScale | null }) {
    const die = feature.levelScale?.dice ? feature.levelScale.dice : feature.levelScale?.die ? feature.levelScale.die : undefined;
    if (feature && feature.levelScale && feature.levelScale.fixedValue) {
      return feature.levelScale.fixedValue;
    } else if (die) {
      return die.diceString;
    } else {
      return "{{scalevalue-unknown}}";
    }
  }

  static getScaleValueLink(ddb: IDDBData, featDefinition: TDDBFeatureMixinDefinitions, noDice = false) {
    const levelScales = "levelScales" in featDefinition ? featDefinition.levelScales : [];
    // only handles classes so far
    const klass = ddb.character.classes.find((cls) =>
      (cls.definition.id === featDefinition.classId
      || cls.subclassDefinition?.id === featDefinition.classId)
      && levelScales.length > 0
      && (!noDice
        || (noDice && !levelScales.every((s) => s.dice !== null && s.dice !== undefined))),
    );

    if (klass) {
      let featureName = utils.referenceNameString(featDefinition.name);

      const special = DDBClass.SPECIAL_ADVANCEMENTS[featDefinition.name]
        ?? DDBSubClass.SPECIAL_ADVANCEMENTS[featDefinition.name];

      if (special && special.fixFunction?.name === "rename") {
        if (special.functionArgs?.identifier) {
          featureName = special.functionArgs.identifier as string;
        }
      }

      const klassName = klass.subclassDefinition && klass.subclassDefinition.id === featDefinition.classId
        ? DDBDataUtils.classIdentifierName(klass.subclassDefinition.name)
        : DDBDataUtils.classIdentifierName(klass.definition.name);
      return `@scale.${klassName}.${featureName}`;
    }

    return undefined;

  }

  static getScaleValueString(ddb: IDDBData, feature: TDDBScaleValueSource) {
    const componentId = "componentId" in feature ? feature.componentId : undefined;
    // each option list can be null in DDB data; a null entry would previously
    // survive .flat() and crash on .definition
    const classOption = [
      ...(ddb.character.options.race ?? []),
      ...(ddb.character.options.class ?? []),
      ...(ddb.character.options.feat ?? []),
    ].find((option) => option.definition.id === componentId);

    let feat = "levelScale" in feature && feature.levelScale && componentId
      ? feature
      : componentId != null
        ? DDBDataUtils.findComponentByComponentId(ddb, componentId)
        : undefined;
    if (!feat && foundry.utils.hasProperty(feature, "flags.ddbimporter.dndbeyond.choice")) {
      const componentId = foundry.utils.getProperty(feature, "flags.ddbimporter.dndbeyond.choice.componentId") as number;
      feat = DDBDataUtils.findComponentByComponentId(ddb, componentId);
    }
    if (!feat && classOption) {
      feat = DDBDataUtils.findComponentByComponentId(ddb, classOption.componentId);
    }
    if (!feat) {
      logger.debug("no scale value for ", feature);
      return { name: undefined, value: undefined };
    }
    const featDefinition = "definition" in feat ? feat.definition : feat as TDDBFeatureMixinDefinitions;
    const scaleValue = DDBDataUtils.getScaleValueLink(ddb, featDefinition);
    if (scaleValue) {
      return {
        name: foundry.utils.getProperty(feat, "definition.name") ?? foundry.utils.getProperty(feat, "name"),
        value: scaleValue,
      };
    }
    // final fallback if scale value extraction fails
    return {
      name: foundry.utils.getProperty(feat, "definition.name") ?? foundry.utils.getProperty(feat, "name"),
      value: DDBDataUtils.getExactScalingValue(feat as { levelScale?: IDDBClassFeatureLevelScale | null }),
    };
  }

  static classIdentifierName(className: string) {
    let result = utils.referenceNameString(className.split("(")[0].trim());
    const removals = [
      "circle-of-the-", "circle-of-",
      "path-of-the-", "path-of-",
      "warrior-of-the-", "warrior-of-",
      "oath-of-the-", "oath-of-",
      "college-of-the-", "college-of-",
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

  static getClassFeature({ ddbData, featureName, className = null, subClassName = null } : {
    ddbData: IDDBData;
    featureName: string;
    className?: string | null;
    subClassName?: string | null;
  }): IDDBClassFeature | undefined {
    for (const klass of ddbData.character.classes) {
      if (className !== null && klass.definition.name !== className) continue;
      if (subClassName !== null && klass.subclassDefinition?.name !== subClassName) continue;
      const feature = klass.classFeatures.find((f) =>
        f.definition.name === featureName && klass.level >= f.definition.requiredLevel,
      );
      if (feature) return feature;
    }

    return undefined;
  }

  static hasClassFeature({ ddbData, featureName, className = null, subClassName = null } : {
    ddbData: IDDBData;
    featureName: string;
    className?: string | null;
    subClassName?: string | null;
  }) {
    return DDBDataUtils.getClassFeature({ ddbData, featureName, className, subClassName }) !== undefined;
  }

  static hasSpeciesTrait({ ddbData, traitName } : { ddbData: IDDBData; traitName: string }) {
    return ddbData.character.race.racialTraits.some((trait) => trait.definition.name === traitName);
  }

  static hasSubClass({ ddbData, subClassName } : { ddbData: IDDBData; subClassName: string }) {
    return ddbData.character.classes.some((klass) =>
      klass.subclassDefinition?.name === subClassName,
    );
  }

  /**
   * Retrieves a list of character choices based on the provided parameters.
   *
   * @param {object} params The parameters for retrieving choices.
   * @param {IDDBData} params.ddb The DDB data object containing character information.
   * @param {string} params.type The type of choice to retrieve.
   * @param {object} params.feat The feature object used to identify the choice.
   * @param {boolean} [params.selectionOnly=true] Whether to return only selections.
   * @param {boolean} [params.filterByParentChoice=false] Whether to filter choices by parent choice ID.
   * @param {string|null} [params.parentChoiceId=null] The parent choice ID to filter by, if applicable.
   *
   * @returns {IDDBChoiceResult[]} An array of choice objects, each representing a valid choice option.
   */
  static getChoices(
    { ddb, type, feat, selectionOnly = true, filterByParentChoice = false,
      parentChoiceId = null } : {
      ddb: IDDBData;
      type: ICoreSourceTypes;
      feat: TDDBFeatureMixinDefinitions | IDDBRacialTrait | IDDBRacialTraitDefinition;
      selectionOnly?: boolean;
      filterByParentChoice?: boolean;
      parentChoiceId?: string | null;
    },
  ): IDDBChoiceResult[] {
    let id = null;
    if ("id" in feat && feat.id) {
      id = feat.id;
    } else if ("definition" in feat && feat.definition.id) {
      id = feat.definition.id;
    }

    const featDefinition: IDDBFeatureDefinitionKindFields
      = "definition" in feat ? feat.definition : feat;
    // const id = feat.id ? feat.id : feat.definition.id ? feat.definition.id : null;
    //  const featDefinition = feat.definition ? feat.definition : feat;

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
            // validChoices filtering guarantees a definition match exists
            if (!optionChoice) continue;
            const options: IDDBChoiceResult[] = optionChoice.options
              .filter((option) => choice.optionIds.length === 0 || choice.optionIds.includes(option.id))
              .map((option) => {
                // mergeObject's InsertKeys inference does not line up with
                // IDDBChoiceResult (which also declares optionComponentId as
                // number while non-option results carry null at runtime)
                const choiceOption = foundry.utils.mergeObject(foundry.utils.deepClone(option), {
                  componentId: choice.componentId,
                  componentTypeId: choice.componentTypeId,
                  choiceId: choice.id,
                  optionId: option.id,
                  optionComponentId: null,
                  parentChoiceId: choice.parentChoiceId,
                  subType: choice.subType,
                  type: type,
                  wasOption: false,
                }) as unknown as IDDBChoiceResult;
                return choiceOption;
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

        const options: IDDBChoiceResult[] = [];
        for (const choice of validChoices) {
          const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
          // validChoices filtering guarantees a definition match exists
          if (!optionChoice) continue;
          const option = optionChoice.options
            .filter((option) => choice.optionIds.length === 0 || choice.optionIds.includes(option.id))
            .find((option) => option.id === choice.optionValue);
          if (!option) {
            // possible when optionIds excludes the selected optionValue; this
            // previously crashed mergeObject with an undefined original
            logger.warn("getChoices: selected option not found in choice definition options", { choice, optionChoice });
            continue;
          }
          // mergeObject's InsertKeys inference does not line up with
          // IDDBChoiceResult (which also declares optionComponentId as number
          // while non-option results carry null at runtime)
          const choiceOption = foundry.utils.mergeObject(foundry.utils.deepClone(option), {
            optionId: option.id,
            optionComponentId: null,
            componentId: choice.componentId,
            componentTypeId: choice.componentTypeId,
            choiceId: choice.id,
            parentChoiceId: choice.parentChoiceId,
            subType: choice.subType,
            type: type,
            wasOption: false,
          }) as unknown as IDDBChoiceResult;
          options.push(choiceOption);
        }

        if (options.length > 0) {
          // console.warn("returning options", {
          //   options,
          // });
          return options;
        }

        const typeOptions = ddb.character.options[type];
        if (typeOptions && typeOptions.length > 0) {
          // if it is a choice option, try and see if the mod matches
          const optionMatch: IDDBChoiceResult[] = typeOptions
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
              const result: IDDBChoiceResult = {
                id: option.definition.id,
                entityTypeId: option.definition.entityTypeId,
                label: option.definition.name,
                description: option.definition.description,
                componentId: option.componentId,
                componentTypeId: option.componentTypeId,
                choiceId: null,
                sourceId: option.definition.sourceId ?? null,
                parentChoiceId: null,
                subType: `${type}-option`,
                type: type,
                wasOption: true,
                optionId: option.definition.id,
                optionComponentId: option.componentId,
              };
              return result;
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

  static getComponentIdFromOptionValue(ddb: IDDBData, type: IActionTypes, optionId: number | string) {
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

  static determineActualFeatureId(ddb: IDDBData, featureId: number, type: IActionTypes = "class") {
    const optionalFeatureReplacement = ddb.character?.optionalClassFeatures
      ? ddb.character.optionalClassFeatures
        .filter((f) => f.classFeatureId === featureId && f.affectedClassFeatureId)
        .map((f) => f.affectedClassFeatureId)
      : [];
    // are we dealing with an optional class feature?
    const choiceFeature = DDBDataUtils.getComponentIdFromOptionValue(ddb, type, featureId);

    const additionalFeature = ddb.character?.optionalClassFeatures
      ? ddb.character.optionalClassFeatures
        .filter((f) => f.classFeatureId === featureId && !f.affectedClassFeatureId)
        .map((f) => f.classFeatureId)
      : [];


    // console.warn("determineActualFeatureId", {
    //   featureId,
    //   optionalFeatureReplacement,
    //   choiceFeature,
    //   additionalFeature,
    // });

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
    } else if (additionalFeature && additionalFeature.length > 0) {
      logger.debug(`Feature ${featureId} is additional to ${additionalFeature[0]}`);
      return additionalFeature[0];
    }

    return featureId;
  }

  static findSubClassByFeatureId(ddb: IDDBData, featureId: number): IDDBClass | undefined {
    // optional class features need this filter, as they replace existing features
    const featId = DDBDataUtils.determineActualFeatureId(ddb, featureId);
    logger.debug(`Finding subclass featureId ${featureId} with featId ${featId}`);

    const klass = ddb.character.classes.find((cls) => {
      const classFeatures = cls.definition.classFeatures;
      if (!cls.subclassDefinition) return false;
      if (!cls.subclassDefinition.classFeatures) return false;

      const subClassFeatures = cls.subclassDefinition.classFeatures.filter((f) =>
        !classFeatures.some((cf) => cf.id === f.id),
      );

      return subClassFeatures.some((feature) => feature.id === featId);
    });
    return klass;
  }

  static findClassByFeatureId(ddb: IDDBData, featureId: number): IDDBClass | undefined {
    // optional class features need this filter, as they replace existing features
    const featId = DDBDataUtils.determineActualFeatureId(ddb, featureId);
    logger.verbose(`Finding featureId ${featureId} with featId ${featId}`);

    let klass = ddb.character.classes.find((cls) => {
      const classFeatures = cls.classFeatures;
      const featureMatch = classFeatures.find((feature) => feature.definition.id === featId);

      if (featureMatch) {
        return true;
      } else {
        // if not in global class feature list lets dig down
        let classFeaturesDef = cls.definition.classFeatures;
        if (cls.subclassDefinition && cls.subclassDefinition.classFeatures) {
          classFeaturesDef = classFeaturesDef.concat(cls.subclassDefinition.classFeatures);
        }
        return classFeaturesDef.some((feature) => feature.id === featId);
      }
    });
    // try class option lookup
    if (!klass) {
      const option = ddb.character.options.class?.find((option) => option.definition.id == featureId);
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

  static findMatchedDDBItem(item: I5eItemData, ownedItems: TImporterItem[], existingMatchedItems: TImporterItem[] | I5eItemData[] = []) : TImporterItem | undefined {
    const itemId = foundry.utils.getProperty(item, "flags.ddbimporter.id");
    const itemDefinitionId = foundry.utils.getProperty(item, "flags.ddbimporter.definitionId");
    return ownedItems.find((owned) => {
      const ownedId = foundry.utils.getProperty(owned, "flags.ddbimporter.id");
      // have we already matched against this id? lets not double dip
      const existingMatch = existingMatchedItems.find((matched) => {
        return foundry.utils.getProperty(owned, "flags.ddbimporter.id") === foundry.utils.getProperty(matched, "flags.ddbimporter.id");
      });
      if (existingMatch) return false;
      // the simple match
      const simpleMatch
        = item.name === owned.name
        && item.type === owned.type
        && itemId === ownedId;
      const definitionIdMatch
        = foundry.utils.hasProperty(item, "flags.ddbimporter.definitionId")
        && foundry.utils.hasProperty(owned, "flags.ddbimporter.id")
        && itemId === ownedId
        && itemDefinitionId === foundry.utils.getProperty(owned, "flags.ddbimporter.definitionId");
      // account for choices in ddb
      const isChoice
        = foundry.utils.hasProperty(item, "flags.ddbimporter.dndbeyond.choice.choiceId")
        && foundry.utils.hasProperty(owned, "flags.ddbimporter.dndbeyond.choice.choiceId");
      const choiceMatch = isChoice
        ? item.flags.ddbimporter.dndbeyond.choice.choiceId
          === owned.flags.ddbimporter.dndbeyond.choice.choiceId
        : true;
      // force an override
      const overrideDetails = foundry.utils.getProperty(owned, "flags.ddbimporter.overrideItem") as IDDBImporterFlagsOverrideItem;
      const overrideMatch
        = overrideDetails
        && item.name === overrideDetails.name
        && item.type === overrideDetails.type
        && item.flags?.ddbimporter?.id === overrideDetails.ddbId;

      return ((simpleMatch || definitionIdMatch) && choiceMatch) || overrideMatch;
    });
  }


  // TO DO: this ignores charges
  // DDB resetType 4 ("Other") and consumable-style resets have no rest period;
  // emitting a recovery entry with an empty period produces junk on the sheet
  static #recoveryForReset(resetType: IResetType | undefined): I5eSystemLimitedUsesRecovery[] {
    if (!resetType?.value) return [];
    return [{ period: resetType.value, type: "recoverAll", formula: undefined }];
  }

  static getLimitedUses({ data, description = "", scaleValue = null } : IDDBDataUtilsLimitedUses): I5eSystemLimitedUses | null {
    let resetType: IResetType | undefined;

    if (foundry.utils.hasProperty(data, "resetType")) {
      resetType = DICTIONARY.resets.find((type) => type.id === data?.resetType);
    }

    if (!resetType) {
      const resetTypeRegex = /(?:(Short) or )?(Long) Rest/ig;
      const match = resetTypeRegex.exec(description);
      if (match && match[1]) {
        resetType = DICTIONARY.resets.find((type) => type.id === match[1]);
      } else if (match && match[2]) {
        resetType = DICTIONARY.resets.find((type) => type.id === match[2]);
      }
    }

    if (
      data
      && ("maxUses" in data || "statModifierUsesId" in data || "useProficiencyBonus" in data)
      && (
        ("maxUses" in data && data.maxUses)
        || ("statModifierUsesId" in data && data.statModifierUsesId)
        || ("useProficiencyBonus" in data && data.useProficiencyBonus)
      )
    ) {
      let maxUses: string | number = ("maxUses" in data && data.maxUses && data.maxUses !== -1) ? data.maxUses : 0;
      const statModifierUsesId = foundry.utils.getProperty(data, "statModifierUsesId");
      if (statModifierUsesId) {
        const ability = DICTIONARY.actor.abilities.find((ability) => ability.id === statModifierUsesId)?.value;

        if (!ability) {
          logger.warn(`getLimitedUses: unknown stat modifier uses id ${statModifierUsesId}`, { data });
        } else if (maxUses === 0) {
          maxUses = `@abilities.${ability}.mod`;
        } else {
          const operator = "operator" in data ? data.operator : undefined;
          switch (operator) {
            case 2:
              maxUses = `${maxUses} * @abilities.${ability}.mod`;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @abilities.${ability}.mod`;
          }
        }
      }

      const useProficiencyBonus = foundry.utils.getProperty(data, "useProficiencyBonus");
      if (useProficiencyBonus) {
        if (maxUses === 0) {
          maxUses = `@prof`;
        } else {
          const proficiencyBonusOperator = foundry.utils.getProperty(data, "proficiencyBonusOperator");
          switch (proficiencyBonusOperator) {
            case 2:
              maxUses = `${maxUses} * @prof`;
              break;
            case 1:
            default:
              maxUses = `${maxUses} + @prof`;
          }
        }
      }

      if (scaleValue) {
        maxUses = scaleValue;
      }

      const finalMaxUses = maxUses
        ? Number.isInteger(maxUses)
          ? maxUses as number
          : maxUses.toString().trim().replace(/^\+/, "").trim()
        : null;

      return {
        spent: foundry.utils.getProperty(data, "numberUsed") as number ?? null,
        max: (finalMaxUses != 0) ? `${finalMaxUses}` : null,
        recovery: DDBDataUtils.#recoveryForReset(resetType),
      };
    } else if (scaleValue) {
      const maxUses = scaleValue;

      return {
        spent: foundry.utils.getProperty(data, "numberUsed") as number ?? null,
        max: (maxUses !== "") ? maxUses : null,
        recovery: DDBDataUtils.#recoveryForReset(resetType),
      };
    } else if (foundry.utils.hasProperty(data, "value")) {
      return {
        spent: foundry.utils.getProperty(data, "numberUsed") as number ?? null,
        max: `${data.value}`,
        recovery: DDBDataUtils.#recoveryForReset(resetType),
      };
    }

    return null;
  }

}
