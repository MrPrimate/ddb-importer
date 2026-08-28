import DDBEnricherData from "../data/DDBEnricherData";

export default class Healer extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    if (this.is2024) {
      return null;
    } else {
      return {
        name: "Stabilize",
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        targetType: "creature",
        activationType: "special",
        activationCondition: "Use a healers kit to stabalize a creature",
        data: {
          healing: DDBEnricherData.basicDamagePart({ bonus: "1", type: "healing" }),
        },
      };
    }
  }

  // dnd5e 6 has no rule-change type that rerolls dice, so the reroll is baked onto the die term
  // itself. AC5e does the same job at roll time, so only one of the two ever emits.
  get nativeHealingRerollModifiers(): string[] {
    return DDBEnricherData.AutoEffects.effectModules().ac5eInstalled ? [] : ["r1"];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2024) {
      const modifiers = this.nativeHealingRerollModifiers;
      return [4, 6, 8, 10, 12]
        .map((die) => {
          return {
            init: {
              name: `Healing (d${die})`,
              type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
            },
            build: {
              generateDamage: false,
              generateHealing: true,
              generateRange: true,
              healingPart: DDBEnricherData.basicDamagePart({
                number: 1,
                denomination: die,
                bonus: "@prof",
                type: "healing",
                modifiers,
              }),
            },
          };
        });
    } else {
      return [

      ];
    }
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.is2024) return [];
    return [
      {
        // 2024 Healer: reroll 1s on healing dice
        name: "Healer",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "modifier=r1;isHeal && healing && isSpell",
            20,
            "flags.automated-conditions-5e.damage.modifier",
          ),
        ],
      },
    ];
  }

}
