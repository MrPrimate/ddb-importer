import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024) level 14. The feature document is a container for the three DDB
 * actions: the once-per-long-rest Bolster temp HP, the free Extinguish on a controlled Undead,
 * and the reaction-plus-level-5-slot Extinguish on an Undead the wizard does not control.
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
      { action: { name: "Extinguish Undead: Spell Slot", type: "class" } },
    ];
  }

}
