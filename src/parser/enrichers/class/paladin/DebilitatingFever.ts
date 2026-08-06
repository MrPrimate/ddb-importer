import DDBEnricherData from "../../data/DDBEnricherData";

export default class DebilitatingFever extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Inflict Disease",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "special",
      activationCondition: "You hit a creature with an attack roll using a weapon",
      targetType: "creature",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Debilitating Fever",
      statuses: ["poisoned", "incapacitated"],
      options: {
        durationSeconds: 60,
        description: "The target is Poisoned and Incapacitated. At the end of each of its turns, it makes a Constitution saving throw, ending the effect on itself on a success.",
      },
    }];
  }

}
