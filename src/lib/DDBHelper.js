import { DICTIONARY } from "../config/_module.mjs";
import { logger, utils } from "./_module.mjs";
import { Effects, mixins } from "../parser/enrichers/_module.mjs";

const DDBHelper = {

  getBookName: (bookId) => {
    const book = CONFIG.DDB.sources.find((source) => source.name.toLowerCase() == bookId.toLowerCase());
    if (book) {
      return book.description;
    } else {
      return "";
    }
  },

  getDamageType: (data) => {
    if (data.definition.damageType) {
      const damageTypeReplace = data.definition.grantedModifiers.find((mod) =>
        mod.type === "replace-damage-type"
        && (!mod.restriction || mod.restriction === ""),
      );

      const damageType = damageTypeReplace
        ? damageTypeReplace.subType.toLowerCase()
        : data.definition.damageType.toLowerCase();
      return damageType;
    } else {
      return undefined;
    }
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
        klass.classFeatures.some((feature) => feature.definition.id === option.componentId),
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
   * @returns {string}
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

  getScaleValueLink: (ddb, feature, flatOnly = false) => {
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
        ? DDBHelper.classIdentifierName(klass.subclassDefinition.name)
        : DDBHelper.classIdentifierName(klass.definition.name);
      return `@scale.${klassName}.${featureName}`;
    }

    return undefined;

  },

  getScaleValueString: (ddb, feature) => {
    const classOption = [ddb.character.options.race, ddb.character.options.class, ddb.character.options.feat]
      .flat()
      .find((option) => option.definition.id === feature.componentId);

    let feat = feature.levelScale ? feature : DDBHelper.findComponentByComponentId(ddb, feature.componentId);
    if (!feat && foundry.utils.hasProperty(feature, "flags.ddbimporter.dndbeyond.choice")) {
      feat = DDBHelper.findComponentByComponentId(ddb, feature.flags.ddbimporter.dndbeyond.choice.componentId);
    }
    if (!feat && classOption) {
      feat = DDBHelper.findComponentByComponentId(ddb, classOption.componentId);
    }
    if (!feat) {
      logger.debug("no scale value for ", feature);
      return { name: undefined, value: undefined };
    }
    const scaleValue = DDBHelper.getScaleValueLink(ddb, feat);
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

  getAdjustedSourceBook(sourceBook) {
    if (["free-rules"].includes(sourceBook)) {
      return "PHB 2024";
    } else if (sourceBook === "BR") {
      return "SRD 5.1";
    } else {
      return sourceBook.replace("-", " ");
    }
  },

  _tweakSourceData: (source) => {
    source.book = DDBHelper.getAdjustedSourceBook(source.book);
    if (source.book === "BR") {
      source.license = "CC-BY-4.0";
    }
    if (game.settings.get("ddb-importer", "no-source-book-pages"))
      source.page = "";
  },

  /**
   * Given a definition, returns an array of sourcebook objects.
   * The sourcebook object is an object with the following properties:
   * - book: the name of the sourcebook
   * - page: the page number of the sourcebook
   * - license: the license of the sourcebook
   * - custom: the custom name of the sourcebook
   * - id: the id of the sourcebook
   * If the definition has a sources array, it will return an array of sourcebook objects.
   * If the definition has a sourceId, it will return an array with one sourcebook object.
   * If the definition has a sourceIds array, it will return an array with one sourcebook object for each sourceId.
   * If the definition has no source information, it will return an empty array.
   * @param {obj} definition item definition
   * @returns {Array} an array of sourcebook objects
   */
  getSourceData: (definition) => {
    const results = [];
    if (definition.sources?.length > 0) {
      // is basic rules (e.g. SRD)
      const basicRules = definition.sources.some((source) => source.sourceType === 2 && source.sourceId === 1);
      const hasPage = definition.sources.some((source) => source.pageNumber !== null);
      const sources = hasPage
        ? definition.sources.filter((source) => source.pageNumber !== null)
        : basicRules
          ? definition.sources.filter((source) => source.sourceType === 2 && source.sourceId === 1)
          : definition.sources.some((source) => source.sourceType === 1)
            ? definition.sources.filter((source) => source.sourceType === 1)
            : definition.sources;
      for (const ds of sources) {
        const ddbSource = CONFIG.DDB.sources.find((ddb) => ddb.id === ds.sourceId);

        const source = {
          book: ddbSource ? ddbSource.name : "Homebrew",
          page: ds.pageNumber ?? "",
          license: "",
          custom: "",
          id: ddbSource ? ddbSource.id : 9999999,
        };
        DDBHelper._tweakSourceData(source);
        results.push(source);
      }
    } else if (definition.sourceIds) {
      for (const sourceId of definition.sourceIds) {
        const ddbSource = CONFIG.DDB.sources.find((ddb) => ddb.id === sourceId);
        const source = {
          book: ddbSource ? ddbSource.name : "Homebrew",
          page: definition.sourcePageNumber ?? "",
          license: "",
          custom: "",
          id: ddbSource ? ddbSource.id : 9999999,
        };

        DDBHelper._tweakSourceData(source);
        results.push(source);
      }
    } else if (definition.sourceId) {
      const ddbSource = CONFIG.DDB.sources.find((ddb) => ddb.id === definition.sourceId);
      const source = {
        book: ddbSource ? ddbSource.name : "Homebrew",
        page: definition.sourcePageNumber ?? "",
        license: "",
        custom: "",
        id: ddbSource ? ddbSource.id : 9999999,
      };
      DDBHelper._tweakSourceData(source);
      results.push(source);
    }
    return results;
  },

  /**
   * Parses the source data of a definition into a single source object
   * @param {obj} definition definition to parse
   * @returns {obj} a source object with the following properties: name, page, license, and custom
   */
  parseSource: (definition) => {
    const sources = DDBHelper.getSourceData(definition);
    const latestSource = sources.length > 0
      ? sources.reduce((prev, current) => {
        return prev.id > current.id ? prev : current;
      })
      : null;

    if (!latestSource) return {
      name: "",
      page: "",
      license: "",
      custom: "",
    };
    delete latestSource.id;
    return latestSource;
  },

  getActiveItemModifiers: (ddb, includeExcludedEffects = false) => {
    // are we adding effects to items?
    const excludedModifiers = (!includeExcludedEffects)
      ? Effects.AutoEffects.getEffectExcludedModifiers("item", true, true)
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
  },

  getActiveItemEffectModifiers: (ddb) => {
    return DDBHelper.getActiveItemModifiers(ddb, true).filter((mod) =>
      Effects.AutoEffects.getEffectExcludedModifiers("item", true, true)
        .some((exMod) => mod.type === exMod.type
      && (mod.subType === exMod.subType || !exMod.subType)),
    );
  },

  getModifiers: (ddb, type, includeExcludedEffects = false, effectOnly = false, useUnfilteredModifiers = false) => {
    // are we adding effects to documents?
    const excludedModifiers = (!includeExcludedEffects || (includeExcludedEffects && effectOnly))
      ? Effects.AutoEffects.getEffectExcludedModifiers(type, true, true)
      : Effects.AutoEffects.getEffectExcludedModifiers(type, false, false);
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
  },

  filterModifiers: (modifiers, type, { subType = null, restriction = ["", null] } = {}) => {
    return modifiers
      .flat()
      .filter(
        (modifier) =>
          modifier.type === type
          && (subType !== null ? modifier.subType === subType : true)
          && (!restriction ? true : restriction.includes(modifier.restriction)),
      );
  },

  filterModifiersOld: (modifiers, type, subType = null, restriction = ["", null]) => {
    return DDBHelper.filterModifiers(modifiers, type, { subType, restriction });
  },

  isComponentIdInClassFeatures: (ddb, componentId, classId) => {
    return ddb.character.classes
      .filter((klass) => classId === klass.definition?.id || classId === klass.subclassDefinition?.id)
      .some((klass) =>
        klass.classFeatures.some((feat) => feat.definition.id == componentId),
      );
  },

  getClassFeatureIds(ddb, { classId = null, requiredLevel = null, exactLevel = null } = {}) {
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
  },

  isModClassFeature: (ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) => {
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
  },

  isModClassOption: (ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) => {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBHelper.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
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
  },

  isModOptionalClassFeature: (ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) => {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBHelper.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
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
  },

  isModOptionalClassChoice(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBHelper.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
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
  },

  isModAGrantedFeatMod(ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) {
    // const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBHelper.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
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
  },

  isModAChosenClassMod: (ddb, mod, { classFeatureIds = null, classId = null, requiredLevel = null, exactLevel = null } = {}) => {
    const klassFeatureIds = classFeatureIds ? classFeatureIds : DDBHelper.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel });
    const isClassFeature = DDBHelper.isModClassFeature(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    // console.warn("isClassFeature", {isClassFeature, mod, klassFeatureIds, classId, requiredLevel, exactLevel});
    if (isClassFeature) return true;
    const isClassOption = DDBHelper.isModClassOption(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    if (isClassOption) return true;
    // if it's been replaced by a class feature lets check that
    const isOptionalClassOption = DDBHelper.isModOptionalClassFeature(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    if (isOptionalClassOption) return true;
    // new class feature choice
    const isOptionalClassChoice = DDBHelper.isModOptionalClassChoice(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    if (isOptionalClassChoice) return true;
    // console.warn("isClassFeature2", {isClassFeature, mod, klassFeatureIds, classId, requiredLevel, exactLevel, isClassOption, isOptionalClassOption, isOptionalClassChoice});
    const isFeatMod = DDBHelper.isModAGrantedFeatMod(ddb, mod, { classFeatureIds: klassFeatureIds, classId, requiredLevel, exactLevel });
    return isFeatMod;
  },

  getChosenTypeModifiers: (ddb, { type = "class", includeExcludedEffects = false, effectOnly = false, classId = null, requiredLevel = null, exactLevel = null, availableToMulticlass = null, useUnfilteredModifiers = null, filterOnFeatureIds = [] } = {}) => {
    const classFeatureIds = DDBHelper.getClassFeatureIds(ddb, { classId, requiredLevel, exactLevel })
      .filter((id) => {
        if (filterOnFeatureIds.length === 0) return true;
        return filterOnFeatureIds.includes(id);
      });
    // get items we are going to interact on
    // console.warn("getChosenTypeModifiers", {
    //   mods: DDBHelper.getModifiers(ddb, type, includeExcludedEffects, effectOnly, useUnfilteredModifiers),
    //   classFeatureIds,
    // });
    const modifiers = DDBHelper
      .getModifiers(ddb, type, includeExcludedEffects, effectOnly, useUnfilteredModifiers)
      .filter((mod) =>
        (
          availableToMulticlass === null
          || mod.availableToMulticlass === undefined
          || mod.availableToMulticlass === null
          || mod.availableToMulticlass === availableToMulticlass
        )
        && DDBHelper.isModAChosenClassMod(ddb, mod, { classFeatureIds, classId, requiredLevel, exactLevel }),
      );

    // console.warn("getChosenClassModifiers", {classFeatureIds, modifiers});
    return modifiers;
  },

  getChosenClassModifiers: (ddb, { includeExcludedEffects = false, effectOnly = false, classId = null, requiredLevel = null, exactLevel = null, availableToMulticlass = null, useUnfilteredModifiers = null, filterOnFeatureIds = [] } = {}) => {
    return DDBHelper.getChosenTypeModifiers(ddb, {
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
  },

  filterBaseCharacterModifiers: (ddb, type, { subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false, classId = null, availableToMulticlass = null, useUnfilteredModifiers = null } = {}) => {
    const modifiers = [
      DDBHelper.getChosenClassModifiers(ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers }),
      DDBHelper.getModifiers(ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getModifiers(ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
    ];

    return DDBHelper.filterModifiersOld(modifiers, type, subType, restriction);
  },

  getAllModifiers: (ddb, { includeExcludedEffects = false, effectOnly = false, classId = null, availableToMulticlass = null, useUnfilteredModifiers = null } = {}) => {
    return [
      DDBHelper.getChosenClassModifiers(ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers }),
      DDBHelper.getModifiers(ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getModifiers(ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getActiveItemModifiers(ddb, includeExcludedEffects),
    ].flat();
  },

  // I need to getChosenOriginFeatures from data.optionalOriginFeatures

  filterBaseModifiers: (ddb, type, { subType = null, restriction = ["", null], includeExcludedEffects = false, effectOnly = false, classId = null, availableToMulticlass = null, useUnfilteredModifiers = null } = {}) => {
    const modifiers = [
      DDBHelper.getChosenClassModifiers(ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers }),
      DDBHelper.getModifiers(ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getModifiers(ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers),
      DDBHelper.getActiveItemModifiers(ddb, includeExcludedEffects),
    ];

    return DDBHelper.filterModifiersOld(modifiers, type, subType, restriction);
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
   * Given a list of modifiers, sums up the bonus value and returns
   * a string representation of the result. May include a dice string.
   * @param {object[]} modifiers modifiers to sum up
   * @param {object} character character to get ability modifiers from
   * @returns {string} a string representation of the sum of modifiers
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
      }
      if (modifier.modifierTypeId === 1 && modifier.bonusTypes.includes(1)) {
        // prof bonus
        sum = DDBHelper.stringIntAdder(sum, character.system.attributes.prof);
      }

    });
    if (diceString !== "") {
      sum = diceString + " + " + sum;
    }

    sum = `${sum}`.trim().replace(/\+\s*\+/, "+").replace(/^\+\s*/, "");

    return sum !== "" ? sum : 0;
  },

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
  getChoices: ({ ddb, type, feat, selectionOnly = true, filterByParentChoice = false,
    parentChoiceId = null } = {},
  ) => {
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
  },

  getComponentIdFromOptionValue: (ddb, type, optionId) => {
    if (ddb.character?.choices && ddb.character.choices[type] && Array.isArray(ddb.character.choices[type])) {
      // find a choice in the related choices-array
      const choice = ddb.character.choices[type].find(
        (characterChoice) => characterChoice.optionValue && characterChoice.optionValue === optionId,
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

  findSubClassByFeatureId: (ddb, featureId) => {
    // optional class features need this filter, as they replace existing features
    const featId = DDBHelper.determineActualFeatureId(ddb, featureId);
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
      && value.valueTypeId == ddbItem.entityTypeId,
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
          && value.valueTypeId == foundryItem.flags.ddbimporter.entityTypeId),
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
          const part = mixins.DDBBasicActivity.buildDamagePart({ damageString: damageBonus });
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
  },

  getName(ddb, item, character = null, allowCustom = true) {
    // spell name
    const customName = character
      ? DDBHelper.getCustomValueFromCharacter(item, character, 8)
      : DDBHelper.getCustomValue(item, ddb, 8);
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
  },

  displayAsAttack(ddb, item, character = null) {
    const customDisplay = character
      ? DDBHelper.getCustomValueFromCharacter(item, character, 16)
      : DDBHelper.getCustomValue(item, ddb, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (foundry.utils.hasProperty(item, "displayAsAttack")) {
      return item.displayAsAttack;
    } else {
      return false;
    }
  },

  extractModifierValue(modifier) {
    let value = "";
    let modBonus = "";

    let statBonus = (modifier.statId)
      ? modifier.statId
      : modifier.abilityModifierStatId
        ? modifier.abilityModifierStatId
        : null;

    if (statBonus) {
      const ability = DICTIONARY.character.abilities.find((ability) => ability.id === modifier.statId).value;
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
  },

  getValueFromModifiers(modifiers, name, modifierSubType, modifierType = "bonus") {
    let bonuses;
    const bonusEffects = DDBHelper.filterModifiersOld(modifiers, modifierType, modifierSubType, null);

    if (bonusEffects.length > 0) {
      logger.debug(`Generating ${modifierSubType} ${modifierType} for ${name}`);
      bonuses = "";
      bonusEffects.forEach((modifier) => {
        let bonusParse = DDBHelper.extractModifierValue(modifier);
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
  },

  findMatchedDDBItem(item, ownedItems, existingMatchedItems = []) {
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
  },

  classIdentifierName(className) {
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
  },

  hasClassFeature({ ddbData, featureName, className = null, subClassName = null } = {}) {
    const result = ddbData.character.classes.some((klass) =>
      klass.classFeatures.some((feature) => feature.definition.name === featureName && klass.level >= feature.definition.requiredLevel)
      && ((className === null || klass.definition.name === className)
        && (subClassName === null || klass.subclassDefinition?.name === subClassName)),
    );

    return result;
  },


  getDuration(text, returnDefault = true, generateSpecial = true) {
    const defaultDurationSeconds = 60;
    const result = {
      type: returnDefault ? "second" : null,
      second: returnDefault ? defaultDurationSeconds : null,
      round: returnDefault ? (defaultDurationSeconds / 6) : null,
      minute: null,
      hour: null,
      special: "",
      value: null,
      units: "inst",
      dae: [],
    };
    const re = /for (\d+) (minute|hour|round|day|month|year)/; // turn|day|month|year
    const match = text.match(re);
    if (match) {
      let seconds = parseInt(match[1]);
      result.type = match[2];
      result.units = match[2];
      result.value = match[1];
      switch (match[2]) {
        case "minute": {
          result.minute = match[1];
          seconds *= 60;
          break;
        }
        case "hour": {
          result.hour = match[1];
          seconds *= 60 * 60;
          break;
        }
        case "round": {
          seconds *= 6;
          result.round = match[1];
          break;
        }
        case "turn": {
          result.turns = match[1];
          break;
        }
        case "day": {
          result.day = match[1];
          seconds *= 60 * 60 * 24;
          break;
        }
        case "year": {
          result.year = match[1];
          seconds *= 60 * 60 * 24 * 365;
          break;
        }
        case "month": {
          result.month = match[1];
          seconds *= 60 * 60 * 24 * 30;
          break;
        }
        // no default
      }

      result.second = seconds;
      return result;
    }


    if (!generateSpecial) return result;

    const smallMatchRe = /until the (?<point>end|start) of (?<whos>its|the target's|your) next turn/ig;
    const smallMatch = smallMatchRe.exec(utils.nameString(text));
    if (smallMatch) {
      result.type = "special";
      result.units = "spec";
      result.second = 6;
      result.round = 1;
      result.special = smallMatch[0];
      // "turnStart" - expires at the start of the targets next turn
      // "turnEnd" - expires at the end of the targets next turn
      // "turnStartSource" - expires at the start of the source actors next turn
      // "turnEndSource" - expires at the end of the source actors next turn
      // "combatEnd" - expires at the end of combat
      // "joinCombat" - expires at the start of combat
      result.dae = [];
      if (["its", "the target's"].includes(smallMatch.groups.whos)) {
        result.dae.push(`turn${utils.capitalize(smallMatch.groups.point)}`);
      } else if (["your"].includes(smallMatch.groups.whos)) {
        result.dae.push(`turn${utils.capitalize(smallMatch.groups.point)}Source`);
      }

      return result;
    }
    return result;
  },

};

export default DDBHelper;
