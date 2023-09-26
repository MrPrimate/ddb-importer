import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateDeathSaves = function _generateDeathSaves () {
  this.raw.character.system.attributes.death = {
    success: this.source.ddb.character.deathSaves.successCount || 0,
    failure: this.source.ddb.character.deathSaves.failCount || 0,
  };
};

DDBCharacter.prototype._generateExhaustion = function _generateExhaustion() {
  const condition = this.source.ddb.character.conditions.find((condition) => parseInt(condition.id) === 4);
  this.raw.character.system.attributes.exhaustion = condition
    ? parseInt(condition.level)
    : 0;
};

DDBCharacter.prototype.getGenericConditionAffect = function getGenericConditionAffect(condition, typeId) {
  const damageTypes = DICTIONARY.character.damageAdjustments
    .filter((type) => type.kind === condition && type.type === typeId)
    .map((type) => type.value);

  let result = DDBHelper
    .filterBaseModifiers(this.source.ddb, condition)
    .filter((modifier) => modifier.isGranted && damageTypes.includes(modifier.subType)
      && (modifier.restriction === "" || !modifier.restriction))
    .map((modifier) => {
      const entry = DICTIONARY.character.damageAdjustments.find(
        (type) => type.type === typeId && type.kind === modifier.type && type.value === modifier.subType
      );
      // TODO
      return entry ? entry.foundryValue || entry.value : undefined;
    });

  result = result.concat(
    this.source.ddb.character.customDefenseAdjustments
      .filter((adjustment) => adjustment.type === typeId)
      .map((adjustment) => {
        const entry = DICTIONARY.character.damageAdjustments.find(
          (type) =>
            (type.id === adjustment.id || type.id === adjustment.adjustmentId)
            && type.type === adjustment.type
            && type.kind === condition
        );
        // TODO
        return entry ? entry.foundryValue || entry.value : undefined;
      })
      .filter((adjustment) => adjustment !== undefined)
  );

  return result;
};

DDBCharacter.prototype._generateConditions = function _generateConditions() {
  this.raw.character.system.traits.di = {
    custom: "",
    value: this.getGenericConditionAffect("immunity", 2),
  };
  this.raw.character.system.traits.dr = {
    custom: "",
    value: this.getGenericConditionAffect("resistance", 1),
  };
  this.raw.character.system.traits.dv = {
    custom: "",
    value: this.getGenericConditionAffect("vulnerability", 3),
  };
  this.raw.character.system.traits.ci = {
    custom: "",
    value: this.getGenericConditionAffect("immunity", 4),
  };
};
