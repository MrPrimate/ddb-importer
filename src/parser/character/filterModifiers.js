import logger from "../../logger.js";

/**
 * UTILITY
 * Returns a string representation of friendlyTypename and friendlySubtypeName for an obj[]
 * @param {object[]} arr array of objects
 */
function extractInfo(arr) {
  return arr.map((e) => `${e.friendlyTypeName} (${e.friendlySubtypeName})`);
}

/**
 * Extracts basic character information
 * @param {object} data Character JSON
 * returns information about the classes this character chose, including
 * - {string} name
 * - {number} level
 * - {boolean} isStartingClass
 * - {object[]} modifiers (empty, will be filled later)
 * }
 */
function getClassInfo(data) {
  return data.classes.map((cls) => {
    return {
      name:
        cls.subclassDefinition && cls.subclassDefinition.name
          ? `${cls.definition.name} (${cls.subclassDefinition.name})`
          : cls.definition.name,
      level: cls.level,
      isStartingClass: cls.isStartingClass,
      modifiers: [],
    };
  });
}

/**
 * Gets all class features up to a certain class level
 * @param {obj} cls character.classes[] entry
 * @param {*} classLevel level requirement up to which the class features should be extracted
 */
export function getClassFeatures(cls, classLevel = 20) {
  if (
    cls.subclassDefinition
    && cls.subclassDefinition.classFeatures
    && Array.isArray(cls.subclassDefinition.classFeatures)
  ) {
    const subclassFeatures = cls.subclassDefinition.classFeatures.map((subclassFeature) => {
      subclassFeature.className = cls.definition.name;
      subclassFeature.subclassName = cls.subclassDefinition.name;
      return subclassFeature;
    });
    const result = cls.classFeatures
      .map((feature) => {
        const f = feature.definition;
        f.className = cls.definition.name;
        f.subclassName = null;
        return f;
      })
      .concat(subclassFeatures)
      .filter((classFeature) => classFeature.requiredLevel <= classLevel)
      .sort((a, b) => a.requiredLevel - b.requiredLevel);
    return result;
  } else {
    const result = cls.classFeatures
      .map((feature) => {
        const f = feature.definition;
        f.className = cls.definition.name;
        f.subclassName = null;
        return f;
      })
      .filter((classFeature) => classFeature.requiredLevel <= classLevel)
      .sort((a, b) => a.requiredLevel - b.requiredLevel);
    return result;
  }
}


/**
 * Checks if a given class is the starting class of this character
 * @param {object} data character data
 * @param {string} className name of the class to check
 * @returns {boolean} true of the class is a starting class, false otherwise
 */
function isStartingClass(data, className) {
  return data.classes.find((cls) => cls.definition.name === className && cls.isStartingClass);
}

/**
 * Gets all class modifiers for a given character
 * This filters out all modifiers that do not have an entry in the class features passed in
 * For multiclassing characters, it checks if the given class is the starting class or a multiclass,
 *    then the `.availableToMulticlass` is queried if this modifier is enabled or not
 * @param {obj} cls character.classes[] entry
 * @param {*} classLevel level requirement up to which the class features should be extracted
 */
function getClassModifiers(data, classFeatures, isStartingClass = false) {
  const modifiers = data.modifiers.class.filter((classModifier) => {
    // check the class from which this modifier came
    const feature = classFeatures.find((feature) => feature.id === classModifier.componentId);
    if (feature !== undefined) {
      const isFeatureAvailable = classModifier.availableToMulticlass ? true : isStartingClass;
      logger.debug(
        `${isFeatureAvailable ? "  [  AVAIL]" : "  [UNAVAIL]"} Modifier found: ${classModifier.friendlyTypeName} (${
          classModifier.friendlySubtypeName
        })`
      );
      return isFeatureAvailable;
    }
    return false;
  });

  return modifiers;
}

export function getAllClassFeatures(data) {
  return data.classes
    .map((cls) => {
      return getClassFeatures(cls, cls.level);
    })
    .flat();
}

function getClassOptionModifiers(data) {
  const classFeatures = getAllClassFeatures(data);

  const modifiers = data.modifiers.class.filter((classModifier) => {
    const componentId = classModifier.componentId;
    const feature = classFeatures.find((feature) => feature.id === componentId);

    if (feature === undefined) {
      logger.debug(`Modifier found: ${classModifier.friendlyTypeName} (${classModifier.friendlySubtypeName})`);
      return true;
    }
    return false;
  });

  return modifiers;
}

/**
 * Filters the modifiers with the utility functions above
 * @param {object} data character data
 * @returns {[object[]]} an array containing an array of filtered modifiers, grouped by class
 */
function filterModifiers(data, classInfo) {
  // get the classFeatures for all classes
  data.classes.forEach((cls, index) => {
    const features = getClassFeatures(cls, cls.level);
    classInfo[index].modifiers = getClassModifiers(data, features, isStartingClass(data, cls.definition.name));
  });
  return classInfo;
}

export function fixCharacterLevels(data) {
  data.unfilteredModifiers = foundry.utils.deepClone(data.character.modifiers);
  const classInfo = getClassInfo(data.character);
  const filteredClassInfo = filterModifiers(data.character, classInfo);
  let classModifiers = getClassOptionModifiers(data.character, classInfo);

  filteredClassInfo.forEach((cls) => {
    logger.debug(`${cls.isStartingClass ? "Starting Class" : "Multiclass"}: [lvl${cls.level}] ${cls.name} `);
    logger.debug(
      extractInfo(cls.modifiers)
        .map((s) => `    ${s}`)
        .join("\n")
    );
    classModifiers = classModifiers.concat(cls.modifiers);
  });
  data.character.modifiers.class = classModifiers;
  return data;
}
