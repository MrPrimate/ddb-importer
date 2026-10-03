import DDBEnricherData from "../data/DDBEnricherData";
import { hitDieDamageActivities } from "./_HitDiceSpell";

/** Grim Hollow blood magic smite: two Hit Point Dice are spent with the slot and rolled as extra Necrotic damage. */
export default class WiltingSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hitDieDamageActivities({ name: "Extra Necrotic Damage", count: 2, type: "necrotic" });
  }

}
