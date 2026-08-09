import DDBEnricherData from "../data/DDBEnricherData";

export default class SearingSmite extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Ongoing Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
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
          activationOverride: { type: "special", condition: "Start of the creatures turn" },
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "On fire from Searing Smite",
      },
    ];
  }
}
