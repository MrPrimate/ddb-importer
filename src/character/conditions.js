import utils from "../utils.js";

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


export async function setConditions(ddb, actor) {
  const dfConditionsOn = utils.isModuleInstalledAndActive("dfreds-convenient-effects");

  console.warn(JSON.parse(JSON.stringify(ddb.character.conditions)));

  for (let i = 0; ddb.character.conditions.length > i; i++) {
    const conditionRef = ddb.character.conditions[i];
    console.warn(conditionRef);
    const conditionLookup = CONDITION_MATRIX.find((condition) => condition.ddbId === conditionRef.id && condition.levelId === conditionRef.level);
    console.warn(conditionLookup);
    
    if (dfConditionsOn && conditionLookup) {
      const conditionApplied = await game.dfreds.effectInterface.hasEffectApplied(conditionLookup.label, actor.uuid);
      console.warn("conditionApplied", conditionApplied);
      if (!conditionApplied) {
        console.warn(`Applying condition ${conditionLookup.label} to ${actor.name} (${actor.uuid})`);
        await game.dfreds.effectInterface.toggleEffect(conditionLookup.label, actor.uuid);
      } else {
        console.warn(`Condition ${conditionLookup.label} exists on ${actor.name} (${actor.uuid})`);
      }
    }
  };

}
