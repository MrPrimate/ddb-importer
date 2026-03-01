import DDBEnricherData from "../data/DDBEnricherData";

export default class RayOfSickness extends DDBEnricherData {

  get activity() {
    if (this.is2014) {
      return {
        noeffect: true,
      };
    } else {
      return null;
    }
  }

  get additionalActivities() {
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

  get addAutoAdditionalActivities() {
    if (this.is2014) return false;
    return true;
  }

}
