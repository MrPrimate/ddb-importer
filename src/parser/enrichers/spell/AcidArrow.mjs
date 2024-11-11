/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class AcidArrow extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        "damage.parts": [
          DDBEnricherMixin.basicDamagePart({ number: 4, denomination: 4, type: "acid" }),
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
          damageParts: [DDBEnricherMixin.basicDamagePart({ number: 2, denomination: 4, type: "acid" })],
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
