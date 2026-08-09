import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritualSecrets extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spiritual Secrets",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you fail an ability check, attack roll, or saving throw",
      addItemConsume: true,
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
          noeffect: true,
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
                target: "sorcery-points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

}
