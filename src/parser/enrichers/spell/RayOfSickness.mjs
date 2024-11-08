/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class RayOfSickness extends DDBEnricherMixin {

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
          constructor: {
            name: "Save vs Poisoned",
            type: "save",
          },
          build: {
            generateDamage: false,
            generateConsumption: false,
            generateSave: true,
            generateTarget: true,
            noSpellslot: true,
            saveOverride: { ability: "con", dc: { calculation: "spellcasting" } },
          },
        },
      ];
    } else {
      return null;
    }
  }

}
