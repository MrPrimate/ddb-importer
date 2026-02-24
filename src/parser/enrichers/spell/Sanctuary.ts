import DDBEnricherData from "../data/DDBEnricherData";

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
        init: {
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
