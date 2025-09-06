/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SummonWildfireSpirit extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      name: "Summon Wildfire Spirit",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Wildfire Summoning Damage",
          type: "save",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          generateSave: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          saveOverride: {
            ability: ["dex"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          targetOverride: {
            template: {
              count: "",
              contiguous: false,
              type: "radius",
              size: "10",
              width: "",
              height: "",
              units: "ft",
            },
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              type: "fire",
            }),
          ],
        },
      },
      {
        constructor: {
          name: "Command Spirit",
          type: "utility",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "bonus",
        },
      },
    ];
  }

}
