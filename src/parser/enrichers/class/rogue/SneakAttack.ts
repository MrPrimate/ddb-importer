import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttack extends DDBEnricherData {

  /** The scale holding the extra damage; other classes' Sneak Attack features name their own. */
  get sneakAttackFormula(): string {
    return "@scale.rogue.sneak-attack";
  }

  /** The midi macro reads the rogue scale, so only the rogue feature carries it. */
  get useMidiSneakAttack(): boolean {
    return true;
  }

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
              customFormula: this.sneakAttackFormula,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
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
            `bonus=${this.sneakAttackFormula}; oncePerTurn; optin; (itemProperties.fin || actionType.rwak) && (hasAdvantage || (!hasDisadvantage && checkNearby(opponentId, 'different', 5, {count: (distance <= 5 ? 2 : 1)})))`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
    return this.useMidiSneakAttack ? effects : effects.filter((effect) => !effect.midiOnly);
  }

  override get itemMacro(): IDDBItemMacro | null {
    return this.is2014 && this.useMidiSneakAttack
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
