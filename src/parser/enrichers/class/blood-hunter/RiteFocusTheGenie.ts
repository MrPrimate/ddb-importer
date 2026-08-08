import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheGenie extends _RiteFocus {

  get patronName(): string {
    return "The Genie";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      activationCondition: _RiteFocus.RITE_CONDITION,
      data: {
        // an active effect duration is numeric, so the formula lives here only
        duration: {
          value: this.hemocraftModifierMin1,
          units: "round",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Genie's Flight",
        activityMatch: this.activityName,
        options: {
          description: "You have a flying speed of 30 feet, for a number of rounds equal to your Hemocraft modifier (minimum of 1 round).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
