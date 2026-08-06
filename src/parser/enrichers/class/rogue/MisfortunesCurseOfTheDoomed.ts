import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheDoomed extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Doomed",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "You miss with an attack roll against a creature cursed by your Evil Eye",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "1",
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: { spent: null, max: "", recovery: [] },
        },
      },
    };
  }

}
