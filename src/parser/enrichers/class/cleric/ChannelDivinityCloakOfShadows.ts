import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityCloakOfShadows extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Invisible",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Invisible"],
      },
    ];
  }
}
