/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class SpiritualWeapon extends DDBEnricherMixin {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        name: "Summon",
        target: {
          override: true,
          template: {
            size: "2.5",
            type: "radius",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Attack",
          type: "attack",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateAttack: true,
          onsave: false,
          noSpellslot: true,
          damageParts: [
            DDBEnricherMixin.basicDamagePart({
              number: 1,
              denomination: 8,
              type: "force",
              scalingMode: "half",
              scalingNumber: 1,
            }),
          ],
          activationOverride: { type: "bonus", condition: "" },
        },
      },
    ];
  }
}
