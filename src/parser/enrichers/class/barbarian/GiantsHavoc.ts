import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiantsHavoc extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
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
