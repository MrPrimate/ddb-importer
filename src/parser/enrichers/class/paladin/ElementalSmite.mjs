/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalSmite extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Dao's Crush",
          type: "utility",
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
        },
        overrides: {
          itemConsumeTargetName: "Channel Divinity",
          addItemConsume: true,
          activationType: "special",
          targetType: "creature",
          activationCondition: "You use Divine Smite",
          noTemplate: true,
        },
      },
      {
        constructor: {
          name: "Djinni's Escape",
          type: "utility",
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateRange: true,
        },
        overrides: {
          itemConsumeTargetName: "Channel Divinity",
          addItemConsume: true,
          activationType: "special",
          targetType: "self",
          activationCondition: "You use Divine Smite",
          noTemplate: true,
          data: {
            range: {
              value: 30,
              long: null,
              units: "ft",
            },
          },
        },
      },
      {
        constructor: {
          name: "Efreeti's Fury",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateTargets: true,
          generateRange: true,
        },
        overrides: {
          itemConsumeTargetName: "Channel Divinity",
          addItemConsume: true,
          targetType: "enemy",
          activationType: "special",
          activationCondition: "You use Divine Smite",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 4,
                  damageType: "fire",
                }),
              ],
            },
            range: {
              value: 30,
              long: null,
              units: "ft",
            },
          },
        },
      },
      {
        constructor: {
          name: "Marid's Surge",
          type: "save",
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
        },
        overrides: {
          itemConsumeTargetName: "Channel Divinity",
          addItemConsume: true,
          activationType: "special",
          targetType: "creature",
          activationCondition: "You use Divine Smite",
          data: {
            save: {
              ability: ["str"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
          },
        },
      },
      {
        constructor: {
          name: "Escape Check",
          type: "check",
        },
        build: {
          generateCheck: true,
          generateTargets: false,
          generateRange: false,
          checkOverride: {
            "associated": [
              "ath",
            ],
            "ability": "str",
            "dc": {
              "calculation": "int",
              "formula": "",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Dao's Crush: Grappled",
        statuses: ["grappled", "restrained"],
        activityMatch: "Dao's Crush",
      },
      {
        name: "Djinni's Escape: Incorporeal Form",
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEndSource"],
        activityMatch: "Djinni's Escape",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("grappled", 20, "system.traits.ci.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("restrained", 20, "system.traits.ci.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("prone", 20, "system.traits.ci.value"),
        ],
      },
      {
        name: "Marid's Surge: Prone",
        statuses: ["prone"],
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

}
