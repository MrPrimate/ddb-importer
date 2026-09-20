import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";

/**
 * Volcanic Fury rolls its save as the ground erupts, once per dawn, and leaves the 20-foot cube
 * as rubble: difficult terrain until someone clears it, so the area it places is permanent. The
 * DC is the one DDB gives.
 */
export default class FuriousFlail extends DDBEnricherData {

  // the parser's own save for this property would sit beside the one built here
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Volcanic Fury", {
        template: { type: "cube", size: "20" },
        range: "10",
        activationCondition: "A point within the weapon's reach; each creature in the area other than you",
        duration: { units: "perm" },
        consume: true,
        save: { ability: ["dex"], dc: "26" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["bludgeoning"] }),
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["fire"] }),
        ],
        onSave: "half",
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["rocks"] }),
        ],
      }),
    ];
  }

}
