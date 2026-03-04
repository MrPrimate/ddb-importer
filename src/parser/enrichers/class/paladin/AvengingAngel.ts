import DDBEnricherData from "../../data/DDBEnricherData";

export default class AvengingAngel extends DDBEnricherData {

  get activity() {
    if (this.ddbParser.isAction) {
      return null;
    }
    return {
      name: "Activate",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.ddbParser.isAction) {
      return [];
    }
    return [
      { action: { name: "Avenging Angel", type: "class" } },
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { mode: "", formula: "" },
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
      activitiesMatch: ["Activate"],
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.attributes.speed.fly"),
      ],
    }];
  }

  get override() {
    const uses = this._getUsesWithSpent({ type: "class", name: "Avenging Angel", max: "1", period: "lr" });
    return {
      uses,
      data: {
        name: "Avenging Angel",
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

}
