/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GiantsHavoc extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        action: {
          name: "Giant's Havoc: Crushing Throw",
          type: "class",
          rename: ["Crushing Throw"],
        },
        overrides: {
          noeffect: true,
        },
      },
      {
        action: {
          name: "Giant's Havoc: Giant Stature",
          type: "class",
          rename: ["Giant Stature"],
        },
      },
    ];
  }

}
