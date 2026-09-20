import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * Every "of Grass" weapon shares one property: a bonus action and a charge grow a 10-foot-radius
 * patch of foliage that is difficult terrain until the command word is spoken again. That and
 * the cover it gives against ranged attacks stay a note on the activity. DDB carries the 7
 * charges on most variants but never their recovery on a Short or Long Rest.
 */
export default class WeaponOfGrass extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Conjure Foliage", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "The foliage is difficult terrain and provides cover against ranged attacks",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "circle", size: "10" },
          },
          rangeOverride: { override: true, value: null, units: "spec", special: "Around the wielder" },
          durationOverride: { override: true, units: "perm" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "7", [{ period: "sr", type: "recoverAll" }]);
  }

}
