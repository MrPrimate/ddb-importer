/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AcidArrow extends DDBEnricherData {

  get activity() {
    return {
      data: {
        "damage.parts": [
          DDBEnricherData.basicDamagePart({ number: 4, denomination: 4, type: "acid" }),
        ],
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "End of Targets Turn Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, type: "acid" })],
          noeffect: true,
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Covered in Acid",
        options: {
          durationSeconds: 6,
        },
      },
    ];
  }

}
