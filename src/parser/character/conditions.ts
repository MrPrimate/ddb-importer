import { DICTIONARY } from "../../config/_module";
import { IDDBConditionMapping } from "../../config/dictionary/actor/conditions";
import { DDBEffectHelper } from "../../effects/_module";
import { logger } from "../../lib/_module";

export interface DDBConditionState extends IDDBConditionMapping {
  label: string;
  foundry: string;
  ddbId: number | null;
  levelId: number | null;
  ddbType: number | null;
  ddbCondition: boolean;
  applied: boolean;
  conditionApplied: ActiveEffect | undefined;
  needsAdd: boolean;
  needsRemove: boolean;
  needsUpdate: boolean;
}

export function getCondition(conditionDDBName: string) {
  return DICTIONARY.conditions.find((condition) => condition.label === conditionDDBName);
}

export function getActorConditionStates(actor, ddb: IDDBData, keepLocal = false): DDBConditionState[] {
  const conditions: DDBConditionState[] = DICTIONARY.conditions
    .filter((condition) => Number.isInteger(condition.ddbId)) // only ddb conditions
    .map((condition) => {
      const conditionApplied = DDBEffectHelper.getConditionEffectAppliedAndActive(condition.label, actor);
      const ddbCondition = ddb.character.conditions.some((conditionState) =>
        conditionState.id === condition.ddbId
        && conditionState.level === condition.levelId,
      );
      const conditionState: DDBConditionState = foundry.utils.mergeObject(condition,
        {
          ddbCondition: ddbCondition,
          applied: conditionApplied !== undefined,
          conditionApplied: conditionApplied,
          needsAdd: ddbCondition && !conditionApplied,
          needsRemove: !ddbCondition && conditionApplied && !keepLocal,
          needsUpdate: (ddbCondition && !conditionApplied) || (!ddbCondition && conditionApplied && !keepLocal),
        }
      ) as DDBConditionState;
      return conditionState;
    });
  return conditions;
}

/**
 * Syncs the conditions between the actor and DDB
 * @param {Actor5e} actor the actor to sync
 * @param {object} ddb the DDB data
 * @param {boolean} [keepLocal=false] if true, will not remove conditions that are not in DDB
 * @returns {Promise<void>}
 */
export async function setConditions(actor, ddb, keepLocal = false) {
  const conditionStates = getActorConditionStates(actor, ddb, keepLocal);
  // console.warn(conditionStates);
  logger.debug(`Condition states for ${actor.name}`, conditionStates);

  // remove conditions first
  for (const condition of conditionStates.filter((c) => c.needsRemove)) {
    logger.debug(`removing ${condition.label}`, { condition });
    const existing = actor.document?.effects?.get(game.dnd5e.utils.staticID(`dnd5e${condition.foundry}`));
    if (existing) await existing.delete();
    if (condition.foundry === "exhaustion") {
      logger.debug("Removing exhaustion", condition.levelId);
      await actor.update({ "system.attributes.exhaustion": 0 });
    }
  }
  for (const condition of conditionStates.filter((c) => c.needsAdd)) {
    logger.debug(`adding ${condition.label}`, { condition });
    const effect = await ActiveEffect.implementation.fromStatusEffect(condition.foundry);
    // @ts-expect-error - we know this is a valid property, but the types don't reflect it
    effect.updateSource({ "flags.dnd5e.exhaustionLevel": condition.levelId });
    const effectData = effect.toObject();
    // console.warn("effect", {effect, effectData});
    // await ActiveEffect.implementation.create(effectData, { parent: actor.document, keepId: true });
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData], { keepId: true });
    if (condition.foundry === "exhaustion") {
      logger.debug("Updating actor exhaustion", condition.levelId);
      await actor.update({ "system.attributes.exhaustion": condition.levelId });
    }
  }
}
