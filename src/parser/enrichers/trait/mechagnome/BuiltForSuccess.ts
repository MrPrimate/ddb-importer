import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Mechagnome (World of Warcraft): add 1d4 to a D20 Test after rolling, Proficiency Bonus uses per
 * Long Rest. The activity rolls the d4 and spends a use.
 */
export default class BuiltForSuccess extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Built for Success",
      activationType: "special",
      activationCondition: "After rolling a D20 Test, before it resolves",
      addItemConsume: true,
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d4",
          name: "D20 Test Bonus",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "@prof",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
