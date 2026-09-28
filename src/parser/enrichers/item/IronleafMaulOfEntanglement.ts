import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Ironleaf Maul of Entanglement: immediately after a hit on a Medium or smaller target, a charge
 * forces a Strength save against 8 + Strength modifier + proficiency: 1d6 piercing and Restrained
 * until the end of its next turn on a failure.
 */
export default class IronleafMaulOfEntanglement extends DDBEnricherData {

  static ENTANGLE = "Entangle";

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(IronleafMaulOfEntanglement.ENTANGLE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], calculation: "str" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["piercing"] })],
        condition: "Immediately after you hit a Medium or smaller target with the maul",
        charges: "1",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ironleaf Maul: Restrained",
        activityMatch: IronleafMaulOfEntanglement.ENTANGLE,
        statuses: ["Restrained"],
        options: { transfer: false, expiry: "targetEnd" },
      },
    ];
  }

}
