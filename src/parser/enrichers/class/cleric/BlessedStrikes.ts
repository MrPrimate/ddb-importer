import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedStrikes extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1d8",
              types: ["radiant"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "divineStrike",
          data: {
            label: `Divine Strike Bonus Damage`,
            count: "each-round",
            "damage.all": "@scale.cleric.divine-strike",
          },
        }],
      },
      {
        name: "Blessed Strikes (Automation)",
        ac5eOnly: true,
        midiNever: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a hit with a weapon attack.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d8[radiant]; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        "spent": 0,
        "recovery": [
          {
            "period": "turnStart",
            "type": "recoverAll",
          },
        ],
        "max": "1",
      },
    };
  }
}
