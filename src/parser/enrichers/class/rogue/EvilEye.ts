import DDBEnricherData from "../../data/DDBEnricherData";

export default class EvilEye extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get type() {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "bonus",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Cursed by Evil Eye",
        statuses: ["Cursed"],
        options: {
          durationSeconds: 60,
          description: "This creature is cursed by the rogue's Evil Eye: sneak attack applies without advantage, and Misfortunes can target it. Ends early if a different creature is cursed.",
        },
      },
    ];
  }

}
