import DDBEnricherData from "../data/DDBEnricherData";

export default class HeatMetal extends DDBEnricherData {
  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Bonus Action Damage",
          activationType: "bonus",
          noSpellslot: true,
          noConsumeTargets: true,
          data: {
            duration: { override: true, units: "inst", concentration: false },
            type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
          },
        },
      },
      {
        init: {
          name: "Save vs Drop",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateDamage: false,
          generateSave: true,
          noSpellslot: true,
          saveOverride: {
            ability: ["con"],
            dc: { calculation: "spellcasting" },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Heat Metal: It's getting real hot",
      },
    ];
  }

  get addAutoAdditionalActivities() {
    return false;
  }

}
