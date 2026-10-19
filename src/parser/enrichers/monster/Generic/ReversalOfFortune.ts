import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReversalOfFortune extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }


  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["healing"] }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: undefined,
          },
        },
        midiOnly: true,
        // the damage is reduced to 0: Midi adds traits.dm values to the damage and caps a
        // reduction at the damage taken
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-999", 20, "system.traits.dm.midi.all"),
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
