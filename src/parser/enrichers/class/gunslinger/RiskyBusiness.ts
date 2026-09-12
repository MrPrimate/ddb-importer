import DDBEnricherData from "../../data/DDBEnricherData";

export default class RiskyBusiness extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "Once per turn, when you make an attack roll without Disadvantage",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      itemConsumeValue: "-1",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Risky Attack",
        ac5eOnly: true,
        options: {
          // the single attack roll this turn
          expiry: "turnEnd",
        },
        daeSpecialDurations: ["1Attack"],
        ac5eChanges: [
          // automated-conditions-5e: the next attack roll is made at
          // disadvantage; "once" expires the flag after a single use
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
