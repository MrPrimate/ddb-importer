import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheInept extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Inept",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye makes a D20 Test",
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
