import DDBEnricherData from "../../data/DDBEnricherData";

export default class TirelessSpirit extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain 1 Use",
      activationType: "encounter",
      activationCondition: "When you roll initiative and have no uses of Fighting Spirit remaining",
      // regains a Fighting Spirit use; like the official Archdruid data it has no uses of its own
      addItemConsume: true,
      itemConsumeTargetName: "Fighting Spirit",
      itemConsumeValue: "-1",
    };
  }

}
