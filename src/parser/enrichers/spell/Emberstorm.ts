import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Evoker): the 6d8 Fire save; unattended flammable objects and creatures in the
 * Sphere start burning, taking 1d8 Fire at the start of each of their turns instead of the usual
 * Burning damage.
 */
export default class Emberstorm extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({ name: "Burning", parts: [1], condition: "At the start of each turn of a creature set burning by the spell" }),
    ];
  }

}
