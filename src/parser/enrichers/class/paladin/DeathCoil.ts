import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Death Coil (World of Warcraft Death Knight and Oath of the Ebon Blade, replacing Lay On Hands): a
 * pool of 1 + Cha mod d8s (minimum one), refilled on a Long Rest. A Bonus Action spends up to the
 * Cha mod (minimum one) dice: a Con save against the Necrotic roll (half on a success), or the roll as
 * healing for an Undead. Improved Death Coil (level 14) adds the Cha mod to the damage on any save
 * and the Death Knight's levels to the healing; it is folded in here when the character has it.
 */
export default class DeathCoil extends DDBEnricherData {

  get hasImprovedDeathCoil(): boolean {
    return this.hasClassFeature({ featureName: "Improved Death Coil" });
  }

  get #scaling(): { allowed: boolean; max: string } {
    return {
      allowed: true,
      max: "clamp(max(@abilities.cha.mod, 1), 1, @item.uses.value)",
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Death Coil: Damage",
      activationType: "bonus",
      addItemConsume: true,
      addScalingMode: "amount",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        consumption: {
          scaling: this.#scaling,
        },
        save: {
          ability: ["con"],
          dc: { calculation: "cha", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["necrotic"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      {
        init: {
          name: "Death Coil: Heal Undead",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateHealing: true,
          generateConsumption: true,
          activationOverride: { type: "bonus", value: 1, condition: "" },
          rangeOverride: { units: "ft", value: "60" },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "creature" },
          },
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 8,
            bonus: this.hasImprovedDeathCoil ? `@classes.${this.classIdentifier("Paladin")}.levels` : "",
            types: ["healing"],
            scalingMode: "whole",
            scalingNumber: 1,
          }),
        },
        overrides: {
          addItemConsume: true,
          addScalingMode: "amount",
          data: {
            consumption: {
              scaling: this.#scaling,
            },
          },
        },
      },
    ];
    if (this.hasImprovedDeathCoil) {
      activities.push({
        init: {
          name: "Improved Death Coil: Extra Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "You deal damage with Death Coil" },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "creature" },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "max(@abilities.cha.mod, 1)",
              types: ["necrotic"],
            }),
          ],
        },
      });
    }
    return activities;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "max(1 + @abilities.cha.mod, 1)",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
