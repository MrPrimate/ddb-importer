import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefensiveTactics extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Choice",
      addItemConsume: true,
      targetType: "self",
      activationType: "special",
      activationCondition: "Finish a short or long rest",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Escape the Horde",
        activityMatch: "Choice",
      },
      {
        name: "Multiattack Defense",
        activityMatch: "Choice",
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "sr", type: "recoverAll", formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
    };
  }

}
