import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { regionPlacer } from "./_ItemRegions";

/**
 * Every "of Grass" weapon shares one property: a bonus action and a charge grow a 10-foot-radius
 * patch of foliage that is difficult terrain until the command word is spoken again. The cover it
 * gives against ranged attacks has no region equivalent and stays a note on the activity. DDB
 * carries the 7 charges on most variants but never their recovery on a Short or Long Rest.
 */
export default class WeaponOfGrass extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Conjure Foliage", {
        template: { type: "circle", size: "10" },
        rangeSpecial: "Around the wielder",
        activationType: "bonus",
        activationCondition: "The foliage also provides cover against ranged attacks",
        duration: { units: "perm" },
        consume: true,
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
        ],
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "7", [{ period: "sr", type: "recoverAll" }]);
  }

}
