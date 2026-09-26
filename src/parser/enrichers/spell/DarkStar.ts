import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * A 40-foot sphere of magical darkness and silence, difficult terrain, whose occupants are deafened
 * and immune to thunder damage while inside. Nothing is rolled as the sphere appears: the cast only
 * places it, and the region fires "Ongoing Save" (DDB's Constitution save and necrotic damage) when a
 * creature passes into it for the first time on a turn or starts its turn there. Creating the sphere
 * on a creature is not entering (enterOn "movement"). A creature reduced to 0 hit points being
 * pulled into the sphere's centre is left to the table.
 */
export default class DarkStar extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain(),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: ONGOING,
        enterOn: "movement",
      }),
      DDBEnricherData.BehaviorHelper.applyEffect({
        effects: [
          DDBEnricherData.SRDEffects.condition("deafened"),
          DDBEnricherData.SRDEffects.damageImmunity("thunder"),
        ],
      }),
    ]);
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [ongoingTrigger({ condition: "Enters the sphere for the first time on a turn or starts its turn there" })];
  }

}
