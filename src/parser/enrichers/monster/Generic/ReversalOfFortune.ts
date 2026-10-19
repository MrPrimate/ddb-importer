import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReversalOfFortune extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }


  get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["healing"] }),
      },
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
        // the damage is reduced to 0: Midi adds traits.dm values to the damage and caps a
        // reduction at the damage taken
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-999", 20, "system.traits.dm.midi.all"),
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
