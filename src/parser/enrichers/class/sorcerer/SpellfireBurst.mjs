/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpellfireBurst extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Spellfire Burst: Bolstering Flames", type: "class", rename: ["Bolstering Flames"] } },
      {
        action: { name: "Spellfire Burst: Radiant Fire (Fire)", type: "class", rename: ["Radiant Fire"] },
      },
    ];
  }

  get overrides() {
    return {
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
        system: {
          uses: {
            max: null,
            spent: null,
            recovery: [],
          },
        },
      },
    };
  }
}
