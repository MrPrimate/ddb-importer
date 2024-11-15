/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class VitriolicSphere extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      data: {
        name: "Save",
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 10,
              denomination: 4,
              type: "acid",
              scalingMode: "whole",
              scalingNumber: "2",
            }),
          ],
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "20",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Secondary Acid Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "spec", condition: "End of next turn" },
          durationOverride: { units: "inst", concentration: false },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 5,
              denomination: 4,
              type: "acid",
            }),
          ],
        },
      },
    ];
  }
}
