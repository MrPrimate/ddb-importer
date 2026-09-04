import DDBEnricherData from "../data/DDBEnricherData";

/** The nine AU Tramontane armours share one enricher; the +1 AC modifier is DDB's. */
export default class TramontaneArmor extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Activate Grasping Tendrils", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateActivation: true, generateConsumption: false, generateTarget: true },
        overrides: { targetType: "self", activationType: "action" },
      },
      {
        init: { name: "Grasping Tendrils", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          saveOverride: { ability: ["str"], dc: { calculation: "", formula: "15" } },
          targetOverride: {
            affects: { type: "creature", choice: true },
            template: { type: "radius", size: "20", units: "ft" },
          },
        },
        overrides: {
          targetType: "creature",
          activationType: "bonus",
          activationCondition: "While the armor is active",
          data: { range: { units: "self" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grappled by Tendrils",
        activityMatch: "Grasping Tendrils",
        statuses: ["Grappled"],
        options: { description: "Escape DC 15; pulled up to 20 feet toward the wearer." },
      },
    ];
  }

}
