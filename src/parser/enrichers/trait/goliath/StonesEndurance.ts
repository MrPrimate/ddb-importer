import DDBEnricherData from "../../data/DDBEnricherData";

export default class StonesEndurance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      activationType: "reaction",
      midiDamageReaction: true,
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d12 + @abilities.con.mod",
          name: "Reduce Damage Roll",
        },
      },
    };
  }

  get effects() {
    return [
      {
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("[[1d12 + @abilities.con.mod]]", 30, "system.traits.dm.midi.all"),
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

  get override() {
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
