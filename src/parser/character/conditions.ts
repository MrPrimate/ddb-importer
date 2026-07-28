import { DICTIONARY } from "../../config/_module";
import DDBEffectHelper from "../../effects/DDBEffectHelper";
import { logger } from "../../lib/_module";

export function getCondition(conditionDDBName: string) {
  return DICTIONARY.conditions.find((condition) => condition.label === conditionDDBName);
}

export function getActorConditionStates(actor: TImporterActor, ddb: IDDBData, keepLocal = false): IDDBConditionState[] {
  const conditions: IDDBConditionState[] = DICTIONARY.conditions
    .filter((condition) => Number.isInteger(condition.ddbId)) // only ddb conditions
    .map((condition) => {
      const conditionApplied = DDBEffectHelper.getConditionEffectAppliedAndActive(condition.label, actor);
      const ddbCondition = ddb.character.conditions.some((conditionState) =>
        conditionState.id === condition.ddbId
        && conditionState.level === condition.levelId,
      );
      const conditionData: Partial<IDDBConditionState> = {
        ddbCondition: ddbCondition,
        applied: conditionApplied !== undefined,
        conditionApplied: conditionApplied !== undefined
          ? foundry.utils.duplicate(conditionApplied) as unknown as I5eEffectData
          : undefined,
        needsAdd: ddbCondition && !conditionApplied,
        needsRemove: !ddbCondition && conditionApplied && !keepLocal,
        needsUpdate: (ddbCondition && !conditionApplied) || (!ddbCondition && conditionApplied && !keepLocal),
      };
      const conditionState: IDDBConditionState = foundry.utils.mergeObject(condition, conditionData) as IDDBConditionState;
      return conditionState;
    });
  return conditions;
}

/**
 * Syncs the conditions between the actor and DDB
 * @param {Actor.Implementation} actor the actor to sync
 * @param {object} ddb the DDB data
 * @param {boolean} [keepLocal=false] if true, will not remove conditions that are not in DDB
 * @returns {Promise<void>}
 */
export async function setConditions(actor: TImporterActor, ddb: IDDBData, keepLocal = false) {
  const conditionStates = getActorConditionStates(actor, ddb, keepLocal);
  // console.warn(conditionStates);
  logger.debug(`Condition states for ${actor.name as string}`, conditionStates);

  // remove conditions first
  for (const condition of conditionStates.filter((c) => c.needsRemove)) {
    logger.debug(`removing ${condition.label}`, { condition });
    const existing: ActiveEffect = actor.effects?.get(game.dnd5e.utils.staticID(`dnd5e${condition.foundry}`)) as ActiveEffect;
    if (existing) await existing.delete();
    if (condition.foundry === "exhaustion") {
      logger.debug("Removing exhaustion", condition.levelId);
      await actor.update({ "system.attributes.exhaustion": 0 } as unknown as  Actor.UpdateData);
    }
  }
  for (const condition of conditionStates.filter((c) => c.needsAdd)) {
    logger.debug(`adding ${condition.label}`, { condition });
    const effect = await ActiveEffect.implementation.fromStatusEffect(condition.foundry) as unknown as ActiveEffect;
    effect.updateSource({ "flags.dnd5e.exhaustionLevel": condition.levelId } as unknown as ActiveEffect.UpdateData);
    const effectData = effect.toObject() as unknown as I5eEffectData;
    // console.warn("effect", {effect, effectData});
    // await ActiveEffect.implementation.create(effectData, { parent: actor.document, keepId: true });
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData as ActiveEffect.CreateData], { keepId: true });
    if (condition.foundry === "exhaustion") {
      logger.debug("Updating actor exhaustion", condition.levelId);
      await actor.update({ "system.attributes.exhaustion": condition.levelId } as Actor.UpdateData);
    }
  }
}
