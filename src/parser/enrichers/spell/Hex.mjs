/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Hex extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Mark Target",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Hex Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "necrotic" })],
          noeffect: true,
          activationOverride: { type: "", condition: "When you hit creature with attack" },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Hexed",
      },
    ];
  }

}
