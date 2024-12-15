/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HeatMetal extends DDBEnricherData {
  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Bonus Action Damage",
          activationType: "bonus",
          noSpellslot: true,
          noConsumeTargets: true,
          data: {
            type: "damage",
          },
        },
      },
      {
        constructor: {
          name: "Save vs Drop",
          type: "save",
        },
        build: {
          generateDamage: false,
          generateSave: true,
          noSpellslot: true,
          saveOverride: {
            ability: ["con"],
            dc: { calculation: "spellcasting" },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Heat Metal: It's getting real hot",
      },
    ];
  }

  get addAutoAdditionalActivities() {
    return false;
  }

}
