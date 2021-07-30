import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

export function getDeathSaves (data) {
  return {
    success: data.character.deathSaves.successCount || 0,
    failure: data.character.deathSaves.failCount || 0,
  };
}

export function getExhaustion(data) {
  let condition = data.character.conditions.find((condition) => (condition.id = 4));
  let level = condition ? condition.level : 0;
  return level;
}

let getGenericConditionAffect = (data, condition, typeId) => {
  const damageTypes = DICTIONARY.character.damageTypes
    .filter((type) => type.kind === condition && type.type === typeId)
    .map((type) => type.value);

  let result = utils
    .filterBaseModifiers(data, condition)
    .filter((modifier) => modifier.isGranted && damageTypes.includes(modifier.subType) &&
      (modifier.restriction === "" || !modifier.restriction))
    .map((modifier) => {
      const entry = DICTIONARY.character.damageTypes.find(
        (type) => type.type === typeId && type.kind === modifier.type && type.value === modifier.subType
      );
      return entry ? entry.foundryValue || entry.value : undefined;
    });

  result = result.concat(
    data.character.customDefenseAdjustments
      .filter((adjustment) => adjustment.type === typeId)
      .map((adjustment) => {
        const entry = DICTIONARY.character.damageTypes.find(
          (type) =>
            (type.id === adjustment.id || type.id === adjustment.adjustmentId) &&
            type.type === adjustment.type &&
            type.kind === condition
        );
        return entry ? entry.foundryValue || entry.value : undefined;
      })
      .filter((adjustment) => adjustment !== undefined)
  );

  return result;
};

export function getDamageImmunities(data) {
  return {
    custom: "",
    value: getGenericConditionAffect(data, "immunity", 2),
  };
}

export function getDamageResistances(data) {
  return {
    custom: "",
    value: getGenericConditionAffect(data, "resistance", 2),
  };
}

export function getDamageVulnerabilities(data) {
  return {
    custom: "",
    value: getGenericConditionAffect(data, "vulnerability", 2),
  };
}

export function getConditionImmunities(data) {
  // get Condition Immunities
  return {
    custom: "",
    value: getGenericConditionAffect(data, "immunity", 1),
  };
}
