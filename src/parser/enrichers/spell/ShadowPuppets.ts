import DDBEnricherData from "../data/DDBEnricherData";

export default class ShadowPuppets extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
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
        // used on later turns while concentrating, so it must not start (and replace) the
        // concentration; the Incapacitated the save applies lasts as long as the spell
        duration: this.followUpDuration,
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

  override get clearAutoEffects(): boolean {
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
