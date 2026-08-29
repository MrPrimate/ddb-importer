import DDBEnricherData from "../data/DDBEnricherData";

export default class RayOfSickness extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return {
        noeffect: true,
      };
    } else {
      return null;
    }
  }

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
    if (this.is2014) {
      return [
        {
          init: {
            name: "Save vs Poisoned",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateDamage: false,
            generateConsumption: false,
            generateSave: true,
            generateTarget: true,
            noSpellslot: true,
            saveOverride: { ability: ["con"], dc: { calculation: "spellcasting" } },
          },
        },
      ];
    } else {
      return null;
    }
  }

  override get addAutoAdditionalActivities(): boolean {
    if (this.is2014) return false;
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }

}
