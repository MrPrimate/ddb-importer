import DDBEnricherData from "../data/DDBEnricherData";

export default class WavesOfExhaustion extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetType: "self",
      noTemplate: true,
      data: { save: { ability: [] }, damage: { parts: [] } },
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Wave of Gray Light", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          targetOverride: {
            affects: { type: "creature" },
            template: { type: "cone", size: "60", units: "ft" },
          },
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: { range: { units: "self" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Exhaustion (Waves of Exhaustion)",
        activityMatch: "Wave of Gray Light",
        statuses: ["Exhaustion"],
        options: { description: "One Exhaustion level per failed save, to a maximum of 4; removed when the spell ends." },
      },
    ];
  }

}
