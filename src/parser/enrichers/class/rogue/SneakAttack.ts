import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttack extends DDBEnricherData {

  /** The scale holding the extra damage; other classes' Sneak Attack features name their own. */
  get sneakAttackFormula(): string {
    return `@scale.${this.classIdentifier("Rogue")}.sneak-attack`;
  }

  /** The midi macro reads the rogue scale, so only the rogue feature carries it. */
  get useMidiSneakAttack(): boolean {
    return true;
  }

  /**
   * Rogue level at which Cunning Strike lets you trade Sneak Attack dice (2024 only). Other
   * classes reuse this enricher for their own Sneak Attack and have no Cunning Strike.
   */
  get cunningStrikeLevel(): number | null {
    return this.is2014 ? null : 5;
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

  /**
   * The reduced roll for Cunning Strike and Devious Strikes lives here rather than on those
   * features (the dnd5e SRD shape) so it spends the once-per-turn Sneak Attack use. Scaling is
   * the number of dice traded for the chosen effects.
   */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    const level = this.cunningStrikeLevel;
    if (level === null) return [];
    const rogue = this.classIdentifier("Rogue");
    return [
      {
        init: {
          name: "Cunning Sneak Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateRange: true,
          generateTarget: true,
          generateDuration: true,
          durationOverride: { value: "", units: "inst" },
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you deal Sneak Attack damage and forgo dice for Cunning Strike",
          },
          rangeOverride: {
            units: "spec",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
              choice: false,
              special: "",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `(@scale.${rogue}.sneak-attack.number - @scaling)d6`,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
        overrides: {
          addItemConsume: true,
          addConsumptionScalingMax: `@scale.${rogue}.sneak-attack.number`,
          data: {
            visibility: { identifier: rogue, level: { min: level, max: null } },
          },
        },
      },
    ];
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
