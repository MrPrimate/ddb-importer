import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Hunter): the hit deals an extra 4d6 Poison with no save and Poisons the target
 * for the duration; at the end of each of its turns it saves, taking 2d6 Poison on a failure and
 * ending the spell on a success.
 */
export default class SerpentSting extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Sting",
      splitDamage: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({ name: "End of Turn Save", parts: [1], save: "con", onSave: "none", condition: "At the end of each of the Poisoned target's turns" }),
    ];
  }

}
