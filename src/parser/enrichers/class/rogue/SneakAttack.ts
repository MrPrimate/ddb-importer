import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttack extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Sneak Attack Damage",
      targetType: "creature",
      activationType: "special",
      noeffect: true,
      addItemConsume: true,
      noTemplate: true,
      data: {
        range: {
          units: "spec",
        },
        damage: {
          critical: { allow: true },
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.rogue.sneak-attack",
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
        name: "Sneak Attack (Automation)",
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        midiOnly: true,
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "sneakAttack.js", document: this.data },
        ],
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: null,
          },
        },
      },
    ];
  }

  override get itemMacro(): IDDBItemMacro | null {
    return this.is2014
      ? {
        type: "feat",
        name: "sneakAttack.js",
      }
      : null;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        "spent": 0,
        "recovery": [
          {
            "period": "turn",
            "type": "recoverAll",
          },
        ],
        "max": "1",
      },
    };
  }
}
