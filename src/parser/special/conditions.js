import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import SETTINGS from "../../settings.js";


export function getCondition(conditionName) {
  return DICTIONARY.conditions.find((condition) => condition.label === conditionName);
}

export async function getActiveConditions(actor) {
  const conditions = await Promise.all(DICTIONARY.conditions.filter(async (condition) => {
    const conditionApplied = await game.dfreds.effectInterface.hasEffectApplied(condition.label, actor.uuid);
    return conditionApplied;
  }));
  return conditions;
}

async function effectAppliedAndActive(condition, actor) {
  return actor.effects.some(
    (activeEffect) =>
      activeEffect?.flags?.isConvenient
      && (activeEffect?.name ?? activeEffect?.label) == condition.label
      && !activeEffect?.disabled
  );
}

export async function getActorConditionStates(actor, ddb, keepLocal = false) {
  const conditions = await Promise.all(DICTIONARY.conditions
    .filter((condition) => Number.isInteger(condition.ddbId)) // only ddb conditions
    .map(async (condition) => {
      const conditionApplied = await effectAppliedAndActive(condition, actor);
      const ddbCondition = ddb.character.conditions.some((conditionState) =>
        conditionState.id === condition.ddbId
        && conditionState.level === condition.levelId
      );
      // eslint-disable-next-line require-atomic-updates
      condition.ddbCondition = ddbCondition;
      // eslint-disable-next-line require-atomic-updates
      condition.applied = conditionApplied;
      // eslint-disable-next-line require-atomic-updates
      condition.needsUpdate = (ddbCondition && !conditionApplied) || (!ddbCondition && conditionApplied && !keepLocal);
      return condition;
    }));
  return conditions;
}

/**
 * Set conditions
 * @param {*} ddb
 * @param {*} actor
 */
export async function setConditions(actor, ddb, keepLocal = false) {
  const dfConditionsOn = game.modules.get("dfreds-convenient-effects")?.active;
  const useCEConditions = game.settings.get(SETTINGS.MODULE_ID, "apply-conditions-with-ce");
  if (dfConditionsOn && useCEConditions) {
    const conditionStates = await getActorConditionStates(actor, ddb, keepLocal);
    // console.warn(conditionStates);
    logger.debug(`Condition states for ${actor.name}`, conditionStates);
    await Promise.all(conditionStates.map(async (condition) => {
      // console.warn(condition);
      if (condition.needsUpdate) {
        const state = condition.conditionApplied ? "off" : "on";
        logger.info(`Toggling condition to ${state} for ${condition.label} to ${actor.name} (${actor.uuid})`);
        await game.dfreds.effectInterface.toggleEffect(condition.label, { uuids: [actor.uuid] });
      } else {
        const state = condition.conditionApplied ? "on" : "off";
        logger.info(`Condition ${condition.label} ignored (currently ${state}) for ${actor.name} (${actor.uuid})`);
      }
      return condition;
    }));
  }
}
