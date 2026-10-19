import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The cast places the Sphere and spends the slot. Each creature in it can then be given one of the
 * two effects, on the cast and again whenever one enters or ends its turn there, so both effects
 * are slot-free follow-ups.
 */
export default class DistortedDistance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const condition = "On the cast, or when a creature enters the Sphere or ends its turn there";
    return [
      {
        init: { name: "Dizzying Elongation", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateActivation: true,
          activationOverride: { type: "special", value: null, condition },
          generateConsumption: false,
          noSpellslot: true,
          generateSave: true,
          saveOverride: { ability: ["int"], dc: { calculation: "spellcasting", formula: "" } },
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "psychic", scalingMode: "none" })],
          onSave: "none",
          noeffect: true,
          generateRange: true,
        },
        overrides: {
          targetType: "creature",
          noTemplate: true,
          data: { range: { units: "spec" } },
        },
      },
      {
        init: { name: "Shortened Space", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateActivation: true,
          activationOverride: { type: "special", value: null, condition },
          generateConsumption: false,
          generateRange: true,
          noSpellslot: true,
        },
        overrides: {
          targetType: "creature",
          noTemplate: true,
          data: { range: { units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shortened Space",
        activityMatch: "Shortened Space",
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("20", 20)],
        options: { expiry: "targetEnd" },
      },
    ];
  }

}
