import DDBEnricherData from "../data/DDBEnricherData";

export default class SavageAttacker extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (this.is2014) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      activationType: "special",
      name: "Savage Attacker - Reroll Weapon Damage",
      addItemConsume: true,
    };
  }

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
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

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        spent: 0,
        recovery: [{ period: "lr", type: "turn", formula: undefined }],
      },
    };
  }

}
