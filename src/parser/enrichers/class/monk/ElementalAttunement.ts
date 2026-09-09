import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElementalAttunement extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return this.is2014
      ? {}
      : {
        name: "Activate Attunement",
        targetType: "self",
        rangeSelf: true,
        activationType: "special",
        activationCondition: "Start of turn",
        data: {
          enchant: {
            identifier: "monk",
            self: true,
          },
        },
      };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014
      ? []
      : [
        {
          init: {
            name: "Elemental Strike",
            type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
          },
          build: {
            generateAttack: true,
            generateDamage: true,
            generateRange: true,
            generateTarget: true,
            generateActivation: true,
            generateConsumption: false,
            damageParts: [
              DDBEnricherData.basicDamagePart({
                customFormula: "@scale.monk.die.die + @mod",
                types: ["bludgeoning", "acid", "cold", "fire", "lightning", "thunder"],
              }),
            ],
          },
          overrides: {
            id: "ddbElementStriAt",
            data: {
              target: {
                affects: {
                  count: "1",
                  type: "creature",
                },
              },
              range: {
                value: 15,
                units: "ft",
              },
              attack: {
                ability: "dex",
                type: {
                  value: "melee",
                  classification: "unarmed",
                },
              },
              duration: {
                units: "inst",
              },
            },
          },
        },
        {
          init: {
            name: "Elemental Save",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateSave: true,
            generateRange: false,
            generateTarget: true,
            generateActivation: true,
            generateConsumption: false,
            saveOverride: {
              ability: ["str"],
              dc: { calculation: "wis", formula: "" },
            },
            activationOverride: {
              type: "special",
              condition: "You deal Elemental Strike damage",
            },
          },
          overrides: {
            id: "ddbElementStriSa",
            data: {
              target: {
                affects: {
                  count: "1",
                  type: "creature",
                },
              },
              range: {
                value: 15,
                units: "ft",
              },
              duration: {
                units: "inst",
              },
            },
          },
        },
      ];
  }

  static STRIDE_EFFECT_ID = "ddbStrideElemEff";

  /**
   * The enchantment profile. Two copies split at monk level 11 so the upper one can carry the
   * Stride of the Elements rider; dnd5e picks the profile by the monk level of the enchant.
   */
  _attunementEnchantment({ min, max, effectRiders = [] }: { min: number | null; max: number | null; effectRiders?: string[] }): IDDBEffectHint {
    return {
      name: "Elemental Attunement",
      activityMatch: "Activate Attunement",
      data: {
        flags: {
          ddbimporter: {
            effectIdLevel: { min, max },
            activityRiders: ["ddbElementStriAt", "ddbElementStriSa"],
            effectRiders,
          },
        },
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", 10, "name"),
        DDBEnricherData.ChangeHelper.overrideChange("spec", 10, "activities[enchant].activation.type"),
        DDBEnricherData.ChangeHelper.overrideChange(
          "end of duration",
          10,
          "activities[enchant].activation.condition",
        ),
        DDBEnricherData.ChangeHelper.overrideChange("End Attunement", 10, "activities[enchant].name"),
        DDBEnricherData.ChangeHelper.overrideChange("[]", 10, "activities[enchant].consumption.targets"),
      ],
      type: "enchant",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return this.is2014
      ? []
      : [
        this._attunementEnchantment({ min: null, max: 10 }),
        this._attunementEnchantment({ min: 11, max: null, effectRiders: [ElementalAttunement.STRIDE_EFFECT_ID] }),
        // Stride of the Elements (level 11): rides on the enchantment above. dnd5e suppresses a
        // rider on its source item, so the transfer only lands while the attunement is active.
        {
          name: "Stride of the Elements",
          activitiesMatch: ["Not real"],
          options: {
            transfer: true,
            description: "While your Elemental Attunement is active you have a Fly Speed and a Swim Speed equal to your Speed.",
          },
          data: {
            _id: ElementalAttunement.STRIDE_EFFECT_ID,
          },
          changes: [
            DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
            DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.swim"),
          ],
        },
      ];
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Elemental Strike", "Elemental Save"],
    };
  }
}
