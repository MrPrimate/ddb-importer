import DDBEnricherData from "../../data/DDBEnricherData";

export default class SharedResilience extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "reaction",
      activationCondition: "An ally in range fails a saving throw",
      itemConsumeTargetName: "Indomitable",
    };
  }

}
