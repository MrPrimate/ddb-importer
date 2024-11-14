/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class HeatMetal extends DDBEnricherMixin {
  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Bonus Action Damage",
          activationType: "bonus",
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

}
