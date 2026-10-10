import DDBEnricherData from "../data/DDBEnricherData";
import { hitDieCastActivities, hitDieDamageActivities } from "./_HitDiceSpell";

/**
 * Grim Hollow blood magic: the rune is cast by spending one Hit Point Die (one more per slot level),
 * and the once-per-turn Radiant damage against Undead rolls those dice. Casting and the damage are
 * separate activities because the damage repeats for the duration.
 */
export default class BloodbaneRune extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ...hitDieCastActivities({ count: 1, perLevel: true }),
      ...hitDieDamageActivities({ name: "Radiant Damage", count: 1, type: "radiant", perLevel: true, spend: false }),
    ];
  }

}
