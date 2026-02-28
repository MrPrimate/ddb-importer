import DDBEnricherData from "../../data/DDBEnricherData";

export default class CunningStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "spec",
      activationCondition: "Dealing Sneak Attack damage",
      data: {
        name: "Poison",
        save: {
          ability: ["con"],
          dc: { calculation: "dex", formula: "" },
        },
        duration: { units: "inst" },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
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
            ability: ["dex"],
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
        init: {
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
        init: {
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
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scale.rogue.sneak-attack.number - @scaling)d6",
              types: DDBEnricherData.allDamageTypes(),
            }),
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
