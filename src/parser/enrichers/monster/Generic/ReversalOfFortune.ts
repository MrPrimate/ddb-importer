import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReversalOfFortune extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }


  get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
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
