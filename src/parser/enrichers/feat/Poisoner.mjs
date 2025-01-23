/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Poisoner extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
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

  get effects() {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        data: {
          "flags.ddbimporter.activitiesMatch": [
            "Poison Save", "Poison Save (Dexterity)",
            "Poison Save (Intelligence)",
          ],
        },
      },
    ];
  }

  get additionalActivities() {
    const results = [
      {
        constructor: {
          name: "Apply Poison",
          type: "utility",
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
              value: 1,
            },
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
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
        constructor: {
          name: "Poison Save",
          type: "save",
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
          constructor: {
            name: "Poison Save (Dexterity)",
            type: "save",
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
          constructor: {
            name: "Poison Save (Intelligence)",
            type: "save",
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

  get override() {
    return {
      data: {
        "system.uses": {
          spent: null,
          max: "20",
        },
        "flags.ddbimporter": {
          retainUseSpent: true,
        },
      },
    };
  }
}
