import DDBEnricherData from "../data/DDBEnricherData";
import { areaPlacer, areaTrigger } from "../data/AreaBuilders";

const MUSHROOM_DAMAGE = "Mushroom Damage";

/**
 * Each charge spent covers one 5-foot space within 60 feet in noxious mushrooms for 1 minute, so
 * the number of squares follows the charges. The spaces are difficult terrain and poison a
 * creature for every 5 feet it moves through them, rolled by hand. DDB records that poison as
 * damage the staff deals when it hits, so it is taken off the weapon attack. The spells it casts
 * are separate and end at the end of the next turn.
 */
export default class FesterwoodFungalStave extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      areaPlacer("Noxious Mushrooms", {
        template: { type: "square", size: "5", count: "@scaling" },
        range: "60",
        activationCondition: "One unoccupied space on solid ground per charge spent; difficult terrain, dismissed as a Bonus Action",
        duration: { value: "1", units: "minute" },
        consume: true,
        consumeScalingMax: "@item.uses.value",
      }),
      areaTrigger(MUSHROOM_DAMAGE, {
        condition: "Moves into or within the mushrooms (2d4 Poison for every 5 feet moved)",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["poison"] }),
        ],
      }),
    ];
  }

}
