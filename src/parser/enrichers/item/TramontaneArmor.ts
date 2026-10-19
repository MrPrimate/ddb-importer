import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The nine AU Tramontane armours share one enricher; the +1 AC modifier is DDB's. Activating the
 * armor is the once-per-dawn use, the Bonus Action save is free while it is active, and the text's
 * own save would otherwise be a third, unnamed activity spending the use.
 */
export default class TramontaneArmor extends DDBEnricherData {

  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Activate Grasping Tendrils", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateDuration: true,
          durationOverride: { value: "1", units: "minute" },
        },
        overrides: { targetType: "self", activationType: "action", addItemConsume: true },
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
      {
        init: { name: "Escape Check", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateCheck: true,
          generateActivation: true,
          generateConsumption: false,
          // either skill escapes a grapple, each with its own ability
          checkOverride: { ability: "", associated: ["ath", "acr"], dc: { calculation: "", formula: "15" } },
          activationOverride: { type: "action", value: 1, condition: "A creature Grappled by the tendrils" },
          generateDuration: true,
          durationOverride: { units: "inst" },
        },
        overrides: { noConsumeTargets: true, noeffect: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grappled by Tendrils",
        activityMatch: "Grasping Tendrils",
        statuses: ["Grappled"],
        options: { transfer: false, description: "Escape DC 15; pulled up to 20 feet toward the wearer." },
      },
    ];
  }

}
