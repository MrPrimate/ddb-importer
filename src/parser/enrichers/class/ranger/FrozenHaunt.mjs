/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FrozenHaunt extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Activate Frozen Haunt",
      targetType: "self",
      activationType: "special",
      activationCondition: "You cast Hunter's Mark",
      noTemplate: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Frozen Soul Damage",
          type: "damage",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          generateDamage: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "When adopted and the start of each turn",
          targetType: "creature",
          rangeSelf: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  die: 4,
                  type: "cold",
                }),
              ],
            },
            target: {
              affects: {
                type: "creature",
                choice: true,
              },
              template: {
                count: "",
                contiguous: false,
                type: "radius",
                size: "15",
                width: "",
                height: "",
                units: "ft",
              },
            },
          },
        },
      },
      {
        constructor: {
          name: "Spend Spell Slot to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            scaling: { allowed: true, max: "6" },
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "4",
                scaling: { mode: "level", formula: "" },
              },
            ],
          },
        },
      },
    ];
  }


  get effects() {
    return [{
      name: "Partially Incorporeal",
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("cold", 20, "system.traits.di.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("grappled", 20, "system.traits.ci.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("prone", 20, "system.traits.ci.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("restrained", 20, "system.traits.ci.value"),
      ],
      activityMatch: "Activate Frozen Haunt",
    }];
  }

  get clearAutoEffects() {
    return true;
  }

}
