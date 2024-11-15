/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class StaffOfCharming extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Auto Save vs Charmspell",
          type: "utility",
        },
        build: {
          generateSave: false,
          generateDamage: false,
          generateConsumption: true,
          consumeActivity: true,
          generateUses: true,
          usesOverride: {
            override: true,
            max: "1",
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
      },
      {
        constructor: {
          name: "Reflect Spell",
          type: "utility",
        },
        build: {
          generateSave: true,
          saveOverride: {
            ability: [""],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
        },
      },
    ];
  }

}
