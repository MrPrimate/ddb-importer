import DDBEnricherData from "../data/DDBEnricherData";

export default class SearingSmite extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      name: "Initial Damage",
      allowCritical: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["fire"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Save vs Ongoing Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "fire",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          noeffect: true,
          activationOverride: { type: "", condition: "Start of the creatures turn" },
        },
        overrides: {
          data: {
            damage: { onSave: "full" },
            save: {
              ability: ["con"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "On fire from Searing Smite",
      },
    ];
  }
}
