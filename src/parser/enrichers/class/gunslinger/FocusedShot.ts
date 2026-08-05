import DDBEnricherData from "../../data/DDBEnricherData";

export default class FocusedShot extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You take the Attack action and make only one ranged attack roll (it also scores a Critical Hit on a hit)",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Focused Shot",
        ac5eOnly: true,
        ac5eChanges: [
          // automated-conditions-5e: advantage on the next attack roll only
          DDBEnricherData.ChangeHelper.customChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
        options: {
          durationRounds: 1,
        },
      },
    ];
  }

}
