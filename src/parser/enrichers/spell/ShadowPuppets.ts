import DDBEnricherData from "../data/DDBEnricherData";

export default class ShadowPuppets extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get addToDefaultAdditionalActivities() {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!["save", "attack"].includes(this.ddbEnricher?._originalActivity?.type ?? "")) return null;
    return {
      name: this.ddbEnricher?._originalActivity?.type === "save" ? "Save vs Incapacitation" : "Bonus Attack",
      noSpellslot: true,
      noeffect: this.ddbEnricher?._originalActivity?.type !== "save",
      activationType: this.ddbEnricher?._originalActivity?.type === "save" ? "special" : "bonus",
      data: {
        sort: this.ddbEnricher?._originalActivity?.type === "save" ? 2 : 3,
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cast",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
        },
        overrides: {
          data: {
            sort: 1,
          },
        },
      },
    ];
  }

  override get clearAutoEffects() {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Cast",
        name: "Animated Shadow",
        options: {
          durationSeconds: 60,
        },
      },
      {
        activityMatch: "Save vs Incapacitation",
        name: "Incapacitated",
        statuses: ["Incapacitated"],
      },
    ];
  }

}
