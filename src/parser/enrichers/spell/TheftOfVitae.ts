import DDBEnricherData from "../data/DDBEnricherData";
import { hitDieDamageActivities } from "./_HitDiceSpell";

/**
 * Grim Hollow blood magic: two Hit Point Dice are spent with the slot and rolled as Necrotic damage.
 * The Temporary Hit Points (triggering damage plus this damage, capped by slot level) are left to
 * the table, since the triggering damage is not known to the activity.
 */
export default class TheftOfVitae extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hitDieDamageActivities({ name: "Necrotic Damage", count: 2, type: "necrotic" });
  }

}
