import DICTIONARY from "../../dictionary.js";
import { getGenericConditionAffectData } from "../../effects/effects.js";
import DDBHelper from "../../lib/DDBHelper.js";
import logger from "../../logger.js";
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

DDBCharacter.prototype.getCharacterGenericConditionAffectData = function getCharacterGenericConditionAffectData(condition, typeId) {

  const modifiers = DDBHelper.filterBaseModifiers(this.source.ddb, condition);
  const standardResults = getGenericConditionAffectData(modifiers, condition, typeId);

  const customResults = this.source.ddb.character.customDefenseAdjustments
    .filter((adjustment) => adjustment.type === (typeId === 4 ? 1 : 2))
    .map((adjustment) => {
      const entry = DICTIONARY.character.damageAdjustments.find((type) =>
        type.id === adjustment.adjustmentId
        && type.type === typeId
      );
      if (!entry) return undefined;
      const valueData = foundry.utils.hasProperty(entry, "foundryValues")
        ? foundry.utils.getProperty(entry, "foundryValues")
        : foundry.utils.hasProperty(entry, "foundryValue")
          ? { value: entry.foundryValue }
          : undefined;
      return valueData;
    })
    .filter((adjustment) => adjustment !== undefined);

  const results = customResults.concat(standardResults).map((result) => {
    if (game.modules.get("midi-qol")?.active && result.midiValues) {
      return {
        value: result.value.concat(result.midiValues),
        bypass: result.bypass,
      };
    } else {
      return result;
    }
  });

  logger.debug(`Condition generation: ${condition}, typeId: ${typeId}`, {
    modifiers,
    standardResults,
    customResults,
    results,
    customDefenseAdjustments: this.source.ddb.character.customDefenseAdjustments,
  });

  return {
    custom: "",
    value: [...new Set(results.map((result) => result.value).flat())],
    bypasses: [...new Set(results.map((result) => result.bypass).flat())],
  };
};

DDBCharacter.prototype._generateConditions = function _generateConditions() {
  this.raw.character.system.traits.di = this.getCharacterGenericConditionAffectData("immunity", 2);
  this.raw.character.system.traits.dr = this.getCharacterGenericConditionAffectData("resistance", 1);
  this.raw.character.system.traits.dv = this.getCharacterGenericConditionAffectData("vulnerability", 3);
  this.raw.character.system.traits.ci = this.getCharacterGenericConditionAffectData("immunity", 4);
};
