import DDBEnricherData from "../data/DDBEnricherData";

export default class DistortedDistance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Dizzying Elongation",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "psychic", scalingMode: "none" })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Shortened Space", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateRange: true,
          noSpellslot: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
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
