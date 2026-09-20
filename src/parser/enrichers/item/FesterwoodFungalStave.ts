import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../data/RegionBuilders";

const MUSHROOM_DAMAGE = "Mushroom Damage";

/**
 * Each charge spent covers one 5-foot space within 60 feet in noxious mushrooms for 1 minute, so
 * the number of squares follows the charges. The spaces are difficult terrain and poison a
 * creature for every 5 feet it moves through them, which a region can only offer once per
 * movement. DDB records that poison as damage the staff deals when it hits, so it is taken off
 * the weapon attack. The spells it casts are separate and end at the end of the next turn.
 */
export default class FesterwoodFungalStave extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Noxious Mushrooms", {
        template: { type: "square", size: "5", count: "@scaling" },
        range: "60",
        activationCondition: "One unoccupied space on solid ground per charge spent; dismissed as a Bonus Action",
        duration: { value: "1", units: "minute" },
        consume: true,
        consumeScalingMax: "@item.uses.value",
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
          DDBEnricherData.BehaviorHelper.activity({
            // an entering movement also has a move-within segment, so move-in would card it twice
            events: ["tokenMoveWithin"],
            activityName: MUSHROOM_DAMAGE,
            oncePerTurn: false,
          }),
        ],
      }),
      regionTrigger(MUSHROOM_DAMAGE, {
        condition: "Moves into or within the mushrooms (2d4 Poison for every 5 feet moved)",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["poison"] }),
        ],
      }),
    ];
  }

}
