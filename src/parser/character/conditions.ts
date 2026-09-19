import { DICTIONARY } from "../../config/_module";
import DDBEffectHelper from "../../effects/DDBEffectHelper";
import { logger } from "../../lib/_module";


export function getCondition(conditionDDBName: string) {
  return DICTIONARY.conditions.find((condition) => condition.label === conditionDDBName);
}

/**
 * dnd5e 6 models Exhaustion as one levelled condition effect (`type: "condition"`,
 * `system: { type: "exhaustion", level }`) that the system creates, renames "Exhaustion (3)" and
 * deletes itself as `system.attributes.exhaustion` changes. The level is therefore read from and
 * written to that attribute, never matched by effect name or built by hand.
 */
function getActorExhaustionLevel(actor: TImporterActor): number {
  return Number(foundry.utils.getProperty(actor, "system.attributes.exhaustion") ?? 0) || 0;
}

/**
 * The applied, enabled effect for a DDB condition. Each Exhaustion level is its own DDB condition
 * entry, so those match on the actor's level rather than on a name.
 */
function getAppliedCondition(condition: (typeof DICTIONARY.conditions)[number], actor: TImporterActor) {
  if (condition.foundry !== "exhaustion" || !condition.levelId) {
    return DDBEffectHelper.getConditionEffectAppliedAndActive(condition.label, actor);
  }
  if (getActorExhaustionLevel(actor) !== condition.levelId) return undefined;
  return DDBEffectHelper.getActorEffects(actor).find((effect) =>
    foundry.utils.getProperty(effect, "system.type") === "exhaustion"
    || (effect as { statuses?: Set<string> }).statuses?.has("exhaustion"),
  ) ?? { name: condition.label };
}

export function getActorConditionStates(actor: TImporterActor, ddb: IDDBData, keepLocal = false): IDDBConditionState[] {
  const conditions: IDDBConditionState[] = DICTIONARY.conditions
    .filter((condition) => Number.isInteger(condition.ddbId)) // only ddb conditions
    .map((condition) => {
      const conditionApplied = getAppliedCondition(condition, actor);
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
        needsRemove: !!(!ddbCondition && conditionApplied && !keepLocal),
        needsUpdate: !!((ddbCondition && !conditionApplied) || (!ddbCondition && conditionApplied && !keepLocal)),
      };
      const conditionState: IDDBConditionState = foundry.utils.mergeObject(condition, conditionData, { inplace: false }) as IDDBConditionState;
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

  // Exhaustion first, as one write of the level DDB holds: the system turns the delta into the
  // condition effect itself, and that follow-up is not awaited, so stepping through 0 on the way to
  // a new level would race the delete against the create.
  const ddbExhaustion = conditionStates.find((c) => c.foundry === "exhaustion" && c.ddbCondition)?.levelId ?? 0;
  const actorExhaustion = getActorExhaustionLevel(actor);
  if (ddbExhaustion !== actorExhaustion && (ddbExhaustion > 0 || !keepLocal)) {
    logger.debug("Updating actor exhaustion", { from: actorExhaustion, to: ddbExhaustion });
    await actor.update({ "system.attributes.exhaustion": ddbExhaustion } as Actor.UpdateData);
  }

  const otherConditions = conditionStates.filter((c) => c.foundry !== "exhaustion");

  // remove conditions first
  for (const condition of otherConditions.filter((c) => c.needsRemove)) {
    logger.debug(`removing ${condition.label}`, { condition });
    const existing: ActiveEffect = actor.effects?.get(game.dnd5e.utils.staticID(`dnd5e${condition.foundry}`)) as ActiveEffect;
    if (existing) await existing.delete();
  }
  for (const condition of otherConditions.filter((c) => c.needsAdd)) {
    logger.debug(`adding ${condition.label}`, { condition });
    const effect = await ActiveEffect.implementation.fromStatusEffect(condition.foundry) as unknown as ActiveEffect;
    const effectData = effect.toObject() as unknown as I5eEffectData;
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData as ActiveEffect.CreateData], { keepId: true });
  }
}
