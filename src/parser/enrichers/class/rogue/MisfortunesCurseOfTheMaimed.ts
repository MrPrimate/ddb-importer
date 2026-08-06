import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheMaimed extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Maimed",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "You roll a 19 on an attack against a creature cursed by your Evil Eye",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "2",
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
