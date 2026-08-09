import DDBEnricherData from "../../data/DDBEnricherData";

export default class TheBeast extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "The Beast",
        options: {
          durationTurns: 1,
          description: "Advantage on D20 Tests until the start of your next turn.",
        },
        daeSpecialDurations: ["turnStartSource"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.all"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Beast",
        max: "@prof",
        period: "sr",
      }),
    };
  }

}
