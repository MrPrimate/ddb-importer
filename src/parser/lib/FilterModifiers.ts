import { logger } from "../../lib/_module";

/**
 * Generates an array of strings representing the type and subtype of each object in the input array.
 * @param {object[]} arr The array of objects, each containing `friendlyTypeName` and `friendlySubtypeName` properties.
 * @returns {string[]} An array of strings formatted as "friendlyTypeName (friendlySubtypeName)".
 */
function extractInfo(arr: IDDBModifier[]) {
  return arr.map((e) => `${e.friendlyTypeName} (${e.friendlySubtypeName})`);
}


/**
 * Extracts character class information from the input data.
 * @param {object} data The character JSON data
 * @returns {object[]} An array of objects containing class information for each class the character has chosen.
 * Each object has properties:
 * - {string} name - The name of the class (including subclass, if any)
 * - {number} level - The character's level in this class
 * - {boolean} isStartingClass - Whether this class is the character's starting class
 * - {object[]} modifiers - An empty array, to be filled with modifiers later
 */
interface IClassModifierInfo {
  name: string;
  level: number;
  isStartingClass: boolean;
  modifiers: IDDBModifier[];
}

function getClassInfo(data: IDDBCharacterData): IClassModifierInfo[] {
  return data.classes.map((cls) => {
    return {
      name:
        cls.subclassDefinition && cls.subclassDefinition.name
          ? `${cls.definition.name} (${cls.subclassDefinition.name})`
          : cls.definition.name,
      level: cls.level,
      isStartingClass: cls.isStartingClass,
      modifiers: [] as IDDBModifier[],
    };
  });
}


/**
 * Gets all class features up to a certain class level
 * @param {obj} cls character.classes[] entry
 * @param {*} [classLevel=20] level requirement up to which the class features should be extracted
 * @returns {object[]} An array of class feature definitions, sorted by required level
 */
// class feature definitions with the parser-injected className/subclassName
type TAnnotatedClassFeature = IDDBClassDefinitionFeature & { className: string; subclassName: string | null };

export function getClassFeatures(cls: IDDBClass, classLevel = 20): TAnnotatedClassFeature[] {
  if (
    cls.subclassDefinition
    && cls.subclassDefinition.classFeatures
    && Array.isArray(cls.subclassDefinition.classFeatures)
  ) {
    // capture outside the closure so the narrowing from the if above holds
    const subclassName = cls.subclassDefinition.name;
    const subclassFeatures = cls.subclassDefinition.classFeatures.map((subclassFeature) => {
      const f = subclassFeature as unknown as TAnnotatedClassFeature;
      f.className = cls.definition.name;
      f.subclassName = subclassName;
      return f;
    });
    const result = cls.classFeatures
      .map((feature) => {
        const f = feature.definition as unknown as TAnnotatedClassFeature;
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
        const f = feature.definition as unknown as TAnnotatedClassFeature;
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
function isStartingClass(data: IDDBCharacterData, className: string) {
  return data.classes.find((cls) => cls.definition.name === className && cls.isStartingClass);
}

/**
 * Gets all class modifiers for a given character and class features
 * This filters out all modifiers that do not have an entry in the class features passed in
 * For multiclassing characters, it checks if the given class is the starting class or a multiclass,
 *    then the `.availableToMulticlass` is queried if this modifier is enabled or not
 * @param {object} data character data
 * @param {Array} classFeatures array of class feature definitions
 * @param {boolean} [isStartingClass=false] whether this class is the starting class or not
 * @returns {Array} array of class modifiers that are available for the given class
 */
function getClassModifiers(data: IDDBCharacterData, classFeatures: TAnnotatedClassFeature[], isStartingClass = false) {
  const modifiers = data.modifiers.class.filter((classModifier) => {
    // check the class from which this modifier came
    const feature = classFeatures.find((feature) => feature.id === classModifier.componentId);
    if (feature !== undefined) {
      const isFeatureAvailable = classModifier.availableToMulticlass ? true : isStartingClass;
      logger.debug(
        `${isFeatureAvailable ? "  [  AVAIL]" : "  [UNAVAIL]"} Modifier found: ${classModifier.friendlyTypeName} (${
          classModifier.friendlySubtypeName
        })`,
      );
      return isFeatureAvailable;
    }
    return false;
  });

  return modifiers;
}

export function getAllClassFeatures(data: IDDBCharacterData): TAnnotatedClassFeature[] {
  return data.classes
    .map((cls) => {
      return getClassFeatures(cls, cls.level);
    })
    .flat();
}

function getClassOptionModifiers(data: IDDBCharacterData) {
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
 * Filters the modifiers for each class of the character
 * @param {object} data character data
 * @param {Array} classInfo an array of objects containing class information for each class the character has chosen.
 * Each object has properties:
 * - {string} name - The name of the class (including subclass, if any)
 * - {number} level - The character's level in this class
 * - {boolean} isStartingClass - Whether this class is the character's starting class
 * - {object[]} modifiers - An empty array, to be filled with modifiers by this function
 * @returns {Array} the same array as `classInfo`, but with modifiers populated
 */
function filterModifiers(data: IDDBCharacterData, classInfo: IClassModifierInfo[]) {
  // get the classFeatures for all classes
  data.classes.forEach((cls, index) => {
    const features = getClassFeatures(cls, cls.level);
    classInfo[index].modifiers = getClassModifiers(data, features, !!isStartingClass(data, cls.definition.name));
  });
  return classInfo;
}

/**
 * Fixes the character levels by removing modifiers that are not applicable
 * to the current class configuration of the character.
 * @param {object} data character data
 * @returns {object} the same character data, but with modifiers fixed
 */
export function fixCharacterLevels(data: IDDBData): IDDBData {
  data.unfilteredModifiers = foundry.utils.deepClone(data.character.modifiers);
  const classInfo = getClassInfo(data.character);
  const filteredClassInfo = filterModifiers(data.character, classInfo);
  let classModifiers = getClassOptionModifiers(data.character);

  filteredClassInfo.forEach((cls) => {
    logger.debug(`${cls.isStartingClass ? "Starting Class" : "Multiclass"}: [lvl${cls.level}] ${cls.name} `);
    logger.debug(
      extractInfo(cls.modifiers)
        .map((s) => `    ${s}`)
        .join("\n"),
    );
    classModifiers = classModifiers.concat(cls.modifiers);
  });
  data.character.modifiers.class = classModifiers;
  return data;
}
