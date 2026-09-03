import DDBEnricherData from "../../data/DDBEnricherData";

export default class FineTuning extends DDBEnricherData {

  // DDB files this as artificer-cantrip-damage, which the generic generator would turn into a
  // per-roll damage rule; the rules text is "one damage roll of the spell" (any artificer spell,
  // once per cast), which the rules layer cannot express, so the activity + midi arm below stay
  override get clearAutoEffects(): boolean {
    return true;
  }

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
              customFormula: "@abilities.int.mod",
              types: DDBEnricherData.allDamageTypes(),
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
          name: "fineTuning",
          data: {
            label: `Fine Tuning Bonus Damage`,
            count: "each-round",
            "damage.all": "@abilities.int.mod",
          },
        }],
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
