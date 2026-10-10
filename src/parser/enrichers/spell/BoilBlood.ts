import DDBEnricherData from "../data/DDBEnricherData";
import { hitDieDamageActivities } from "./_HitDiceSpell";

/** Grim Hollow blood magic: one Hit Point Die is spent with the slot and rolled as Fire damage. */
export default class BoilBlood extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return hitDieDamageActivities({ name: "Fire Damage", count: 1, type: "fire" });
  }

}
