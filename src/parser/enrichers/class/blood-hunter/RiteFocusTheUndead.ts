import DDBEnricherData from "../../data/DDBEnricherData";
import _RiteFocus from "./_RiteFocus";

export default class RiteFocusTheUndead extends _RiteFocus {

  override get patronName(): string {
    return "The Undead";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.activityName,
      targetType: "self",
      rangeSelf: true,
      activationType: "reaction",
      activationCondition: "When you take necrotic damage",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Undead Resilience",
        activityMatch: this.activityName,
        midiOnly: true,
        options: {
          description: "Halve the necrotic damage you are taking.",
        },
        // midiChanges: [
        //   DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.uncanny-dodge"),
        // ],
        daeSpecialDurations: ["1Reaction" as const],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      midiDamageReaction: true,
    };
  }

}
