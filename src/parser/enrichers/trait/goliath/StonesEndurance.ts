import DDBEnricherData from "../../data/DDBEnricherData";

export default class StonesEndurance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      midiDamageReaction: true,
      addItemConsume: true,
      // with Midi the effect rolls the reduction itself, and a utility roll would hold the
      // reaction until it is rolled by hand, after the damage has already landed
      data: this.useMidiAutomations
        ? {}
        : {
          roll: {
            prompt: false,
            visible: false,
            formula: "1d12 + @abilities.con.mod",
            name: "Reduce Damage Roll",
          },
        },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        // Midi adds traits.dm values to the damage and ignores dice there, so the reduction is
        // negative and DAE rolls the inline term when it creates the effect
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-[[1d12 + @abilities.con.mod]]", 30, "system.traits.dm.midi.all"),
        ],
        daeSpecialDurations: ["1Reaction"],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "race",
        name: this.ddbParser.originalName,
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
