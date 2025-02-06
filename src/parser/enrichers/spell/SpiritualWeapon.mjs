/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpiritualWeapon extends DDBEnricherData {
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
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              bonus: "@mod",
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
