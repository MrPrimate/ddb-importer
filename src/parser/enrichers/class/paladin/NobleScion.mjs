/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class NobleScion extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Activate Noble Scion",
      addItemConsume: true,
      targetType: "self",
      activationType: "bonus",
      noTemplate: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Minor Wish",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateConsumption: false,
          generateActivation: true,
          generateUtility: true,
        },
        overrides: {
          targetType: "ally",
          data: {
            range: {
              value: "@scale.paladin.aura-of-protection",
              long: null,
              units: "ft",
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
            scaling: { allowed: true, max: "5" },
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
                target: "5",
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
      options: {
        durationSeconds: 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.attributes.movement.fly"),
        DDBEnricherData.ChangeHelper.upgradeChange("true", 2, "system.attributes.movement.hover"),
      ],
    }];
  }

  get clearAutoEffects() {
    return true;
  }

}
