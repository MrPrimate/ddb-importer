/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SiegeStaff extends DDBEnricherData {

  get activity() {
    return {
      addItemConsume: false,
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Battering Strike Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          addItemConsume: true,
          itemConsumeValue: "1",
          addConsumptionScalingMax: "@item.uses.value",
          data: {
            damage: {
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "(@scaling)d6",
                  types: ["bludgeoning"],
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Fire Pot Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          addItemConsume: false,
          data: {
            damage: {
              onSave: "half",
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 6,
                  types: ["fire"],
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Trebuchet",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "action",
          addItemConsume: true,
          itemConsumeValue: "3",
          data: {
            save: {
              ability: ["dex"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              onSave: "half",
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 4,
                  denomination: 8,
                  types: ["bludgeoning"],
                }),
              ],
            },
          },
        },
      },
    ];
  }


}
