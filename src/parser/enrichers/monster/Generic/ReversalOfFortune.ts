import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReversalOfFortune extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }


  get activity() {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          duration: {
            turns: 1,
          },
        },
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "system.traits.dm.midi.all"),
        ],
        daeSpecialDurations: [
          "1Reaction" as const,
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      midiDamageReaction: true,
    };
  }

}
