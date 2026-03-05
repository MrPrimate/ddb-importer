import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeviousStrikes extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Daze",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Dealing Sneak Attack damage",
      data: {
        save: {
          ability: ["con"],
          dc: { calculation: "dex", formula: "" },
        },
        duration: { units: "inst" },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Knock Out",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            condition: "Dealing Sneak Attack damage",
          },
          saveOverride: {
            ability: ["con"],
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
          name: "Obscure",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            value: "1",
            units: "minute",
          },
          activationOverride: {
            type: "special",
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
          name: "Modified Sneak Attack Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          noeffect: true,
          activationOverride: {
            type: "special",
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
            DDBEnricherData.basicDamagePart({ customFormula: "(@scale.rogue.sneak-attack.number - @scaling)d6", types: ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"] }),
          ],
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Knocked Out",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Unconscious"],
        activityMatch: "Knock Out",
      },
      {
        name: "Blinded",
        options: {
        },
        statuses: ["Blinded"],
        activityMatch: "Obscure",
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }
}
