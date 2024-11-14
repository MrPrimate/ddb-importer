/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class VitriolicSphere extends DDBEnricherMixin {
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
            DDBEnricherMixin.basicDamagePart({
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
            DDBEnricherMixin.basicDamagePart({
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
