import DDBEnricherData from "../data/DDBEnricherData";

/** AU / DMLS origin feat: Dodge as a bonus action, proficiency-bonus uses per long rest. */
export default class ArcaneInfiltrator extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cunning Diversion",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dodging",
        activityMatch: "Cunning Diversion",
        statuses: ["Dodging"],
        options: { expiry: "sourceStart" },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Cunning Diversion: Dodge",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
