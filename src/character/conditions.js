import utils from "../utils.js";
import logger from "../logger.js";

const CONDITION_MATRIX = [
  { label: "Blinded", statusId: "Convenient Effect: Blinded", ddbId: 1, levelId: null, ddbType: 1 },
  { label: "Charmed", statusId: "Convenient Effect: Charmed", ddbId: 2, levelId: null, ddbType: 1 },
  { label: "Deafened", statusId: "Convenient Effect: Deafened", ddbId: 3, levelId: null, ddbType: 1 },
  { label: "Exhaustion 1", statusId: "Convenient Effect: Exhaustion 1", ddbId: 4, levelId: 1, ddbType: 2 },
  { label: "Exhaustion 2", statusId: "Convenient Effect: Exhaustion 2", ddbId: 4, levelId: 2, ddbType: 2 },
  { label: "Exhaustion 3", statusId: "Convenient Effect: Exhaustion 3", ddbId: 4, levelId: 3, ddbType: 2 },
  { label: "Exhaustion 4", statusId: "Convenient Effect: Exhaustion 4", ddbId: 4, levelId: 4, ddbType: 2 },
  { label: "Exhaustion 5", statusId: "Convenient Effect: Exhaustion 5", ddbId: 4, levelId: 5, ddbType: 2 },
  { label: "Exhaustion 6", statusId: "Convenient Effect: Exhaustion 6", ddbId: 4, levelId: 6, ddbType: 2 },
  { label: "Frightened", statusId: "Convenient Effect: Frightened", ddbId: 5, levelId: null, ddbType: 1 },
  { label: "Grappled", statusId: "Convenient Effect: Grappled", ddbId: 6, levelId: null, ddbType: 1 },
  { label: "Incapacitated", statusId: "Convenient Effect: Incapacitated", ddbId: 7, levelId: null, ddbType: 1 },
  { label: "Invisible", statusId: "Convenient Effect: Invisible", ddbId: 8, levelId: null, ddbType: 1 },
  { label: "Paralyzed", statusId: "Convenient Effect: Paralyzed", ddbId: 9, levelId: null, ddbType: 1 },
  { label: "Petrified", statusId: "Convenient Effect: Petrified", ddbId: 10, levelId: null, ddbType: 1 },
  { label: "Poisoned", statusId: "Convenient Effect: Poisoned", ddbId: 11, levelId: null, ddbType: 1 },
  { label: "Prone", statusId: "Convenient Effect: Prone", ddbId: 12, levelId: null, ddbType: 1 },
  { label: "Restrained", statusId: "Convenient Effect: Restrained", ddbId: 13, levelId: null, ddbType: 1 },
  { label: "Stunned", statusId: "Convenient Effect: Stunned", ddbId: 14, levelId: null, ddbType: 1 },
  { label: "Unconscious", statusId: "Convenient Effect: Unconscious", ddbId: 15, levelId: null, ddbType: 1 },
];

export function getCondition(conditionName) {
  return CONDITION_MATRIX.find((condition) => condition.label === conditionName);
}

export async function getActiveConditions(actor) {
  const conditions = await Promise.all(CONDITION_MATRIX.filter(async (condition) => {
    const conditionApplied = await game.dfreds.effectInterface.hasEffectApplied(condition.label, actor.uuid);
    return conditionApplied;
  }));
  return conditions;
}

async function effectAppliedAndActive(condition, actor) {
  return actor.data.effects.some(
    (activeEffect) =>
      activeEffect?.data?.flags?.isConvenient &&
      activeEffect?.data?.label == condition.label &&
      !activeEffect?.data?.disabled
  );
}

export async function getActorConditionStates(actor, ddb) {
  const conditions = await Promise.all(CONDITION_MATRIX.map(async (condition) => {
    // const conditionApplied = await game.dfreds.effectInterface.hasEffectApplied(condition.label, actor.uuid);
    const conditionApplied = await effectAppliedAndActive(condition, actor);
    const ddbCondition = ddb.character.conditions.some((conditionState) =>
      conditionState.id === condition.ddbId &&
      conditionState.level === condition.levelId
    );
    // eslint-disable-next-line require-atomic-updates
    condition.ddbCondition = ddbCondition;
    // eslint-disable-next-line require-atomic-updates
    condition.applied = conditionApplied;
    // eslint-disable-next-line require-atomic-updates
    condition.needsUpdate = (ddbCondition && !conditionApplied) || (!ddbCondition && conditionApplied);
    return condition;
  }));
  return conditions;
}

/**
 * Set conditions
 * @param {*} ddb
 * @param {*} actor
 */
export async function setConditions(actor, ddb) {
  const dfConditionsOn = utils.isModuleInstalledAndActive("dfreds-convenient-effects");
  if (dfConditionsOn) {
    const conditionStates = await getActorConditionStates(actor, ddb);
    // console.warn(conditionStates);
    await Promise.all(conditionStates.map(async (condition) => {
      // console.warn(condition);
      if (condition.needsUpdate) {
        const state = condition.conditionApplied ? "off" : "on";
        logger.info(`Toggling condition to ${state} for ${condition.label} to ${actor.name} (${actor.uuid})`);
        await game.dfreds.effectInterface.toggleEffect(condition.label, actor.uuid);
      } else {
        const state = condition.conditionApplied ? "on" : "off";
        logger.info(`Condition ${condition.label} ignored (currently ${state}) for ${actor.name} (${actor.uuid})`);
      }
      return condition;
    }));
  }
}
