import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Mystic Arts level 11: after a Stunning Strike the target has Disadvantage on
 * saves against the monk's spells until the start of the monk's next turn. AC5e can scope the
 * source; midi cannot, so its twin is unconditional.
 */
export default class FocusedStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Apply Focused Strike",
      targetType: "creature",
      activationType: "special",
      activationCondition: "After you use Stunning Strike",
      data: { range: { units: "spec" } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Focused Strike",
        activityMatch: "Apply Focused Strike",
        options: {
          expiry: "sourceStart",
          description: "Disadvantage on saving throws against the monk's spells.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "isSpell && effectOriginTokenId === opponentId",
            20,
            "flags.automated-conditions-5e.save.disadvantage",
          ),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
        ],
      },
    ];
  }

}
