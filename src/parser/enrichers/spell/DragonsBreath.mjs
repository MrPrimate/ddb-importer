/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DragonsBreath extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
      noTemplate: true,
      overrideTarget: true,
      targetType: "creature",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Breathe",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
        },
        overrides: {
          noSpellslot: true,
          data: {
            damage: {
              onSave: "half",
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 3,
                  denomination: 6,
                  types: ["acid", "cold", "fire", "lightning", "poison"],
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
