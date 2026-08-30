import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheFathomless extends _RiteFocus {

  override get patronName(): string {
    return "The Fathomless";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      useActivitySnippet: true,
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: `${_RiteFocus.DAMAGE_CONDITION}. Once per turn.`,
    };
  }

  override get effects(): IDDBEffectHint[] {
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
          expiry: "sourceStart",
          description: "Your speed is reduced by 10 feet until the start of the blood hunter's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20),
        ],
      },
    ];
  }

}
