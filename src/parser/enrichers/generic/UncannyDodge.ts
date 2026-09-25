import DDBEnricherData from "../data/DDBEnricherData";

export default class UncannyDodge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }


  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.uncanny-dodge"),
        ],
        daeSpecialDurations: [
          "1Reaction",
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      midiDamageReaction: true,
    };
  }

}
