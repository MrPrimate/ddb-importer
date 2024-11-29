/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityCloakOfShadows extends DDBEnricherData {
  get type() {
    return "utility";
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

  get effects() {
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
