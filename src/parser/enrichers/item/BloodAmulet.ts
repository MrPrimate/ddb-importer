import DDBEnricherData from "../data/DDBEnricherData";

export default class BloodAmulet extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Extra Necrotic Damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you deal damage to a creature",
      addItemConsume: true,
      noTemplate: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "necrotic", scalingMode: "none" })],
        },
        range: { units: "spec" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Exhaustion Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          noConsumeTargets: true,
          noTemplate: true,
          data: { range: { units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Exhaustion (Blood Amulet)",
        activityMatch: "Exhaustion Save",
        statuses: ["Exhaustion"],
        options: { description: "The target gains 1 Exhaustion level." },
      },
    ];
  }

}
