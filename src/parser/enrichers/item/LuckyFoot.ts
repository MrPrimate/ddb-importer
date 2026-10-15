import DDBEnricherData from "../data/DDBEnricherData";

export default class LuckyFoot extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Reroll",
      activationType: "special",
      activationCondition: "You roll a 1 on a saving throw or ability check; you must use the new roll",
    };
  }

  // the foot disintegrates after its one reroll; as dnd5e equipment it cannot destroy itself, so
  // the spent use is left for the user to remove
  override get override(): IDDBOverrideData {
    return {
      uses: { spent: 0, max: "1", recovery: [] },
    };
  }

}
