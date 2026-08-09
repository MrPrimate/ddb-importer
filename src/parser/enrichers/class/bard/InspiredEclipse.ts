import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspiredEclipse extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Give someone Bardic Inspiration",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["Invisible"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnStart" as const, "1Attack" as const, "1Spell" as const],
      },
    ];
  }

}
