import DDBEnricherData from "../../data/DDBEnricherData";

export default class DragonWings extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Use",
      noConsumeTargets: true,
      // default scrape picks up the 5 sorcery point recharge effect
      addItemConsume: true,
      targetType: "self",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend Sorcery Points to Restore Use",
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
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "3",
                target: "feat:sorcery-points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Dragon Wings",
      max: "1",
      period: "lr",
    });
    return {
      data: {
        system: {
          uses,
        },
      },
      replaceActivityUses: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Dragon Wings",
      options: {
        // 2024: "The wings last for 1 hour or until you dismiss them"; the 2014 wings have no
        // time limit at all
        durationSeconds: this.is2014 ? null : 3600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.attributes.movement.fly"),
      ],
    }];
  }

}
