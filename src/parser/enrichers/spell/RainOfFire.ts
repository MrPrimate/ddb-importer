import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Warlock): the 3d8 Fire save in the Cylinder; your spell attacks that hit a
 * creature inside deal an extra 1d6 Necrotic, which DDB lists as a second part of the save.
 */
export default class RainOfFire extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({ name: "Hellfire: Extra Damage", parts: [1], condition: "Your spell attack hits a creature in the Cylinder" }),
    ];
  }

}
