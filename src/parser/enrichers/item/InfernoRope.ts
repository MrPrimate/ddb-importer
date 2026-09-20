import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData } from "../data/RegionBuilders";

/**
 * Igniting the rope rolls its save at once, so lighting it is the save, and the wall's region
 * fires that same save again for a creature that enters the fire or ends its turn inside. The
 * first roll also catches creatures within 5 feet of the wall, which the 10-foot line does not
 * cover, so those are targeted by hand.
 */
export default class InfernoRope extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Ignite", {
      template: { type: "wall", size: "10", width: "1", height: "15" },
      range: "5",
      duration: { value: "1", units: "minute" },
      consume: true,
      save: { ability: ["dex"], dc: "13" },
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["fire"] }),
      ],
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnEnd"],
          excludeSelf: true,
        }),
      ],
    });
  }

}
