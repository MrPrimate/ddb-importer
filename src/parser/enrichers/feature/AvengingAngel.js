/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class AvengingAngel extends DDBEnricherMixin {

  get activity() {
    if (this.ddbParser.isAction) {
      return {
        noeffect: true,
      };
    }
    return {
      name: "Activate",
      type: "utility",
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  get additionalActivities() {
    if (this.ddbParser.isAction) {
      return [];
    }
    return [
      { action: { name: "Avenging Angel", type: "class" } },
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
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effect() {
    if (this.ddbParser.isAction) {
      return null;
    }
    return {
      clearAutoEffects: true,
      name: "Avenging Angel (Wings)",
      options: {
        transfer: false,
        durationSeconds: 600,
      },
      data: {
        "flags.ddbimporter.activitiesMatch": ["Activate"],
      },
      changes: [
        DDBEnricherMixin.generateUpgradeChange("60", 2, "system.attributes.speed.fly"),
      ],
    };
  }

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Avenging Angel", max: "1", period: "lr" });
    return {
      data: {
        name: "Avenging Angel",
        "system.uses": uses,
      },
    };
  }

}
