/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpiritGuardians extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Place Template",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Damage",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateSave: true,
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 8,
              types: ["necrotic", "radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          noeffect: true,
          activationOverride: { type: "", condition: "Enters or ends turn in emanation (1 turn only)" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            template: {},
            affects: {
              type: "creature",
            },
          },
          saveOverride: {
            ability: ["wis"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
        },
      },
    ];
  }
}
