import DDBEnricherData from "../data/DDBEnricherData";

export default class SavageAttacker extends DDBEnricherData {

  get type() {
    if (this.is2014) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    if (this.is2014) return null;
    return {
      activationType: "special",
      name: "Savage Attacker - Reroll Weapon Damage",
      addItemConsume: true,
    };
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [
          {
            name: "savagAttacker",
            data: {
              label: "Savage Attacker - Weapon Damage Reroll?",
              count: "turn",
              "damage.mwak": "reroll-kh",
            },
          },
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        spent: 0,
        recovery: [{ period: "lr", type: "turn", formula: undefined }],
      },
    };
  }

}
