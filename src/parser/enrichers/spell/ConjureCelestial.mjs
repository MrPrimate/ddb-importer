/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ConjureCelestial extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity() {
    if (this.is2014) return null;
    if (!["save", "heal"].includes(this.ddbEnricher?._originalActivity?.type)) return null;
    return {
      name: this.ddbEnricher?._originalActivity?.type === "save" ? "Searing Light" : "Healing Light",
      noSpellslot: true,
      noTemplate: true,
      data: {
        sort: 10000,
        healing: {
          scaling: {
            mode: "whole",
            number: "1",
          },
        },
        "damage.parts": [
          DDBEnricherData.basicDamagePart({
            number: 6,
            denomination: 12,
            types: ["radiant"],
            scalingMode: "whole",
            scalingNumber: "1",
          }),
        ],
      },
    };
  }

  get additionalActivities() {
    if (this.is2014) return null;
    return [
      {
        constructor: {
          name: "Cast",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
        },
      },
    ];
  }

}
