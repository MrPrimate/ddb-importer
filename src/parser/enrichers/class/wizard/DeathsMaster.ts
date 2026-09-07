import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024) level 14. DDB currently ships this feature under the level 10 name
 * "Harvest Undead" (bug reported 2026-09-03); once corrected it resolves here and carries the
 * Bolster / Extinguish actions, and HarvestUndead stops pulling them.
 */
export default class DeathsMaster extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Bolster Undead: Bonus Temp HP", type: "class" } },
      { action: { name: "Extinguish Undead", type: "class" } },
    ];
  }

}
