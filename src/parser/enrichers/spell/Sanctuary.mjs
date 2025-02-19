/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Sanctuary extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        name: "Cast",
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Target",
          type: "save",
        },
        build: {
          noSpellslot: true,
          generateDamage: false,
          generateSave: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          targetType: "creature",
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Sanctuary",
        matchActivity: "Cast",
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
