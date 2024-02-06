import DICTIONARY from "../../dictionary.js";
import DDBEffectHelper from "../../effects/DDBEffectHelper.js";
import logger from "../../logger.js";
import SETTINGS from "../../settings.js";

export function getCondition(conditionName) {
  return DICTIONARY.conditions.find((condition) => condition.label === conditionName);
}

export function getActorConditionStates(actor, ddb, keepLocal = false) {
  const conditions = DICTIONARY.conditions
    .filter((condition) => Number.isInteger(condition.ddbId)) // only ddb conditions
    .map((condition) => {
      const conditionApplied = DDBEffectHelper.getConditionEffectAppliedAndActive(condition.label, actor);
      const ddbCondition = ddb.character.conditions.some((conditionState) =>
        conditionState.id === condition.ddbId
        && conditionState.level === condition.levelId
      );
      condition.ddbCondition = ddbCondition;
      condition.applied = conditionApplied !== undefined;
      condition.conditionApplied = conditionApplied;
      condition.needsAdd = ddbCondition && !conditionApplied;
      condition.needsRemove = !ddbCondition && conditionApplied && !keepLocal;
      condition.needsUpdate = (ddbCondition && !conditionApplied) || (!ddbCondition && conditionApplied && !keepLocal);
      return condition;
    });
  return conditions;
}

async function adjustConditionsWithCE(actor, conditionStates) {
  for (const condition of conditionStates) {
    if (condition.needsUpdate) {
      const state = condition.conditionApplied ? "off" : "on";
      logger.info(`Toggling condition to ${state} for ${condition.label} to ${actor.name} (${actor.uuid})`);
      // eslint-disable-next-line no-await-in-loop
      await game.dfreds.effectInterface.toggleEffect(condition.label, { uuids: [actor.uuid] });
    } else {
      const state = condition.conditionApplied ? "on" : "off";
      logger.info(`Condition ${condition.label} ignored (currently ${state}) for ${actor.name} (${actor.uuid})`);
    }
  }
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
