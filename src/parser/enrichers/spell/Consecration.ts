import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, emanation, ONGOING, ongoingTrigger } from "./_SpellRegions";

/**
 * World of Warcraft (Paladin): a 15-foot Emanation from the caster; creatures of the caster's
 * choice that start their turn in it take 1d8 Radiant. The cast places the emanation and rolls
 * nothing; the region fires the free damage at the start of each creature's turn there, skipping the
 * caster. Choosing which creatures, and the Difficult Terrain for Fiends and Undead, are left to
 * the table.
 */
export default class Consecration extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnStart"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
    ], { target: emanation("15") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({ name: ONGOING, condition: "A creature of your choice starts its turn in the Emanation", noSave: true }),
    ];
  }

}
