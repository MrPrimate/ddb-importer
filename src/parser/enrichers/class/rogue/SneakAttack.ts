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
      {
        name: "Sneak Attack (Automation)",
        ac5eOnly: true,
        midiNever: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage with a Finesse or ranged weapon, when you have advantage or an ally is within 5 feet of the target.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.rogue.sneak-attack; oncePerTurn; optin; (itemProperties.fin || actionType.rwak) && (hasAdvantage || (!hasDisadvantage && checkNearby(opponentId, 'different', 5, {count: (distance <= 5 ? 2 : 1)})))",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
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
