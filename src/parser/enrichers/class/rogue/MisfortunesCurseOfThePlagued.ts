import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfThePlagued extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Curse of the Plagued",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye would regain Hit Points",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "1",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Plagued",
        options: {
          durationRounds: 1,
          description: "Healing halved, then this creature cannot regain Hit Points until the start of the rogue's next turn.",
        },
      },
    ];
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
