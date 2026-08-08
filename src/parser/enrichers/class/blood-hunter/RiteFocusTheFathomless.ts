import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheFathomless extends _RiteFocus {

  get patronName(): string {
    return "The Fathomless";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: `${_RiteFocus.DAMAGE_CONDITION}. Once per turn.`,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fathomless Depths",
        activityMatch: "No Activity",
        options: {
          transfer: true,
          description: "You can breathe underwater.",
        },
      },
      {
        name: "Dragged Under",
        activityMatch: this.activityName,
        options: {
          description: "Your speed is reduced by 10 feet until the start of the blood hunter's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.subtractChange("10", 20, "system.attributes.movement.walk"),
        ],
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
