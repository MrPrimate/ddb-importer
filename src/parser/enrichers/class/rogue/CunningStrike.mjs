/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class CunningStrike extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "spec",
      activationCondition: "Dealing Sneak Attack damage",
      data: {
        name: "Poison",
        save: {
          ability: "con",
          dc: { calculation: "dex", formula: "" },
        },
        duration: { units: "inst" },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Trip",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "",
            condition: "Dealing Sneak Attack damage",
          },
          saveOverride: {
            ability: "dex",
            dc: { calculation: "dex", formula: "" },
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Withdraw",
          type: "utility",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          targetSelf: true,
          generateRange: false,
          noeffect: true,
          generateActivation: true,
          activationOverride: {
            type: "",
            condition: "Dealing Sneak Attack damage",
          },
        },
      },
      {
        constructor: {
          name: "Modified Sneak Attack Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          noeffect: true,
          activationOverride: {
            type: "spec",
            condition: "",
          },
          rangeOverride: {
            units: "spec",
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
          consumptionOverride: {
            scaling: {
              allowed: true,
              max: "@scale.rogue.sneak-attack.number",
            },
          },
          damageParts: [
            DDBEnricherMixin.basicDamagePart({ customFormula: "(@scale.rogue.sneak-attack.number - @scaling)d6", types: ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"] }),
          ],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Poisoned",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Poisoned"],
        activityMatch: "Poison",
      },
      {
        name: "Prone",
        statuses: ["Prone"],
        activityMatch: "Trip",
      },
    ];
  }


  get clearAutoEffects() {
    return true;
  }

}
