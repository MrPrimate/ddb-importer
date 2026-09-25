import DDBEnricherData from "../data/DDBEnricherData";

export default class ShieldMaster extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.SAVE : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2024) return null;
    return {
      name: "Shield Bash",
      activationType: "special",
      activationCondition: "Once per turn, when you hit a creature within 5 feet of you with a melee weapon as part of the Attack action while holding a shield",
      targetType: "creature",
      targetCount: 1,
      rangeSelf: true,
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.is2024) return [];
    return [
      {
        name: "Shield Bashed",
        activityMatch: "Shield Bash",
        statuses: ["Prone"],
      },
    ];
  }

}
