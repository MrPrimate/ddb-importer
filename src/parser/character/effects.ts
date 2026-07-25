import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { AutoEffects } from "../enrichers/effects/_module";
import { DDBModifiers } from "../lib/_module";

DDBCharacter.prototype._generateDeathSaves = function _generateDeathSaves (this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const attributes = this.raw.character.system.attributes;
  if (!ddb || !attributes) {
    logger.warn("Unable to generate death saves, missing DDB source data or character attributes");
    return;
  }
  attributes.death = {
    success: ddb.character.deathSaves.successCount || 0,
    failure: ddb.character.deathSaves.failCount || 0,
  };
};

DDBCharacter.prototype._generateExhaustion = function _generateExhaustion(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const attributes = this.raw.character.system.attributes;
  if (!ddb || !attributes) {
    logger.warn("Unable to generate exhaustion, missing DDB source data or character attributes");
    return;
  }
  const condition = ddb.character.conditions.find((condition) => condition.id === 4);
  attributes.exhaustion = condition
    ? condition.level ?? 0
    : 0;
};

interface IMidiValueAdjustment extends I5eDamageTraitSet {
  midiValues?: string[];
}

DDBCharacter.prototype.getCharacterGenericConditionAffectData = function getCharacterGenericConditionAffectData(this: DDBCharacter, condition: TDDBDamageConditionType, typeId: number): I5eDamageTraitSet | I5eConditionTraitSet {

  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to generate condition data, no DDB source data", { condition, typeId });
    return { custom: "", value: [], bypasses: [] };
  }

  const modifiers = DDBModifiers.filterBaseModifiers(ddb, condition);
  const standardResults = AutoEffects.getGenericConditionAffectData(modifiers, condition, typeId);

  const customResults: IMidiValueAdjustment[] = ddb.character.customDefenseAdjustments
    .filter((adjustment) => adjustment.type === (typeId === 4 ? 1 : 2))
    .map((adjustment): IMidiValueAdjustment | undefined => {
      const entry = DICTIONARY.actor.damageAdjustments.find((type) =>
        type.id === adjustment.adjustmentId
        && type.type === typeId,
      );
      if (!entry) return undefined;
      const foundryValues = foundry.utils.getProperty(entry, "foundryValues") as IMidiValueAdjustment | undefined;
      const valueData: IMidiValueAdjustment | undefined = foundryValues
        ?? (entry.foundryValue !== undefined
          ? { value: [entry.foundryValue], bypasses: [] }
          : undefined);
      if (valueData && entry.midiValues) valueData.midiValues = entry.midiValues;
      return valueData;
    })
    .filter((adjustment): adjustment is IMidiValueAdjustment => adjustment !== undefined);

  const combined = [...customResults, ...standardResults];
  const results = combined.map((result) => {
    if (game.modules?.get("midi-qol")?.active && result.midiValues) {
      return {
        value: (result.value ?? []).concat(result.midiValues),
        bypasses: result.bypasses,
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
    customDefenseAdjustments: ddb.character.customDefenseAdjustments,
  });

  return {
    custom: "",
    value: [...new Set(results.map((result) => result.value).flat())],
    bypasses: [...new Set(results.map((result) => result.bypasses).flat())],
  };
};

DDBCharacter.prototype._generateConditions = function _generateConditions(this: DDBCharacter) {
  const traits = this.raw.character.system.traits;
  if (!traits) {
    logger.warn("Unable to generate conditions, no character traits");
    return;
  }
  traits.di = this.getCharacterGenericConditionAffectData("immunity", 2);
  traits.dr = this.getCharacterGenericConditionAffectData("resistance", 1);
  traits.dv = this.getCharacterGenericConditionAffectData("vulnerability", 3);
  traits.ci = this.getCharacterGenericConditionAffectData("immunity", 4);
};
