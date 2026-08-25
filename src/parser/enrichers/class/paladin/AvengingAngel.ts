import DDBEnricherData from "../../data/DDBEnricherData";

export default class AvengingAngel extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.ddbParser.isAction) {
      return [];
    }
    return [
      {
        init: {
          name: "Place Aura",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            condition: "While the aura is active",
          },
          targetOverride: {
            override: true,
            affects: {
              type: "enemy",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenEnter"],
                activityName: "Avenging Angel",
              }),
            ],
          },
        },
      },
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

  override get effects(): IDDBEffectHint[] {
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
        DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.attributes.movement.speeds.fly"),
      ],
    }];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({ type: "class", name: "Avenging Angel", max: "1", period: "lr" });
    return {
      uses,
      data: {
        name: "Avenging Angel",
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
