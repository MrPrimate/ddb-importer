import DDBEnricherData from "../data/DDBEnricherData";

export default class Poisoner extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Brew Poisons",
      addItemConsume: true,
      itemConsumeValue: "-@prof",
      noeffect: true,
      data: {
        img: "systems/dnd5e/icons/svg/items/consumable.svg",
        duration: {
          value: "1",
          units: "hour",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        activitiesMatch: [
          "Poison Save", "Poison Save (Dexterity)",
          "Poison Save (Intelligence)",
        ],
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const results: IDDBAdditionalActivity[] = [
      {
        init: {
          name: "Apply Poison",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          img: "icons/skills/toxins/poison-bottle-corked-fire-green.webp",
          generateConsumption: true,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          targetOverride: {
            affects: {
              type: "creature",
              count: "1",
            },
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "1",
                scaling: {
                  mode: "",
                  formula: "",
                },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
    if (this.is2014) {
      results.push({
        init: {
          name: "Poison Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              type: "poison",
            }),
          ],
          saveOverride: {
            ability: ["con"],
            dc: {
              formula: "14",
              calculation: "",
            },
          },
        },
      });
    } else {
      results.push(
        {
          init: {
            name: "Poison Save (Dexterity)",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateConsumption: false,
            generateTarget: true,
            generateSave: true,
            generateRange: false,
            generateActivation: true,
            generateDamage: true,
            activationOverride: {
              type: "special",
              value: 1,
              condition: "",
            },
            damageParts: [
              DDBEnricherData.basicDamagePart({
                number: 2,
                denomination: 8,
                type: "poison",
              }),
            ],
            saveOverride: {
              ability: ["con"],
              dc: {
                formula: "",
                calculation: "dex",
              },
            },
          },
        },
        {
          init: {
            name: "Poison Save (Intelligence)",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateConsumption: false,
            generateTarget: true,
            generateSave: true,
            generateRange: false,
            generateActivation: true,
            generateDamage: true,
            activationOverride: {
              type: "special",
              value: 1,
              condition: "",
            },
            damageParts: [
              DDBEnricherData.basicDamagePart({
                number: 2,
                denomination: 8,
                type: "poison",
              }),
            ],
            saveOverride: {
              ability: ["con"],
              dc: {
                formula: "",
                calculation: "int",
              },
            },
          },
        },
      );
    }

    return results;
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "20",
      },
      retainUseSpent: true,
    };
  }
}
