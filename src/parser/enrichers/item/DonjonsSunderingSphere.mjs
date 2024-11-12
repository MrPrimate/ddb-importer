/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class DonjonsSunderingSphere extends DDBEnricherMixin {

  get type() {
    return "enchant";
  }

  get effects() {
    return [
      {
        type: "enchant",
        magicalBonus: {
          bonus: "1",
        },
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Isolating Smite: Save vs Banishment",
          type: "save",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateSave: true,
          generateUses: true,
          usesOverride: {
            max: "1",
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
        overrides: {
          addActivityConsume: true,
        },
      },
    ];
  }

}