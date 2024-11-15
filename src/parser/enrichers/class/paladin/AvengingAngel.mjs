/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AvengingAngel extends DDBEnricherData {

  get activity() {
    if (this.ddbParser.isAction) {
      return null;
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

  get effects() {
    if (this.ddbParser.isAction) {
      return [];
    }
    return [{
      name: "Avenging Angel (Wings)",
      options: {
        durationSeconds: 600,
      },
      data: {
        "flags.ddbimporter.activitiesMatch": ["Activate"],
      },
      changes: [
        DDBEnricherData.generateUpgradeChange("60", 2, "system.attributes.speed.fly"),
      ],
    }];
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

  get clearAutoEffects() {
    return true;
  }

}
