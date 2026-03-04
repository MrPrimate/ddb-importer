import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityCloakOfShadows extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
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

  get effects(): IDDBEffectHint[] {
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
