import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Vestige Patron (AU 2024). The feature is a companion feature (companions.ts), so its primary
 * activity is the summon built from the chosen option's stat block; the bonus-action command and
 * the option's own DDB actions are added beside it. Action hints for options the character did
 * not choose match nothing and are skipped.
 */
export default class VestigeCompanion extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Command Vestige",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activationType: "bonus",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Vestige Strike (Melee)", type: "class" } },
      { action: { name: "Vestige Strike (Ranged)", type: "class" } },
      { action: { name: "Vestige: Healing Touch", type: "class" } },
      { action: { name: "Fiendish Swap", type: "class" } },
      { action: { name: "Cursed Invocation", type: "class" } },
    ];
  }

}
