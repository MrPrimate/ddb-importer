import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingClone, ongoingTrigger } from "./_SpellRegions";

/**
 * A fixed 20-foot sphere, not an emanation. The 2014 cloud rolls nothing as it appears: the cast
 * only places it, and the region fires "Ongoing Save" when a creature passes into it for the
 * first time on a turn or starts its turn there. Creating the cloud on a creature or moving it
 * onto one is not entering (enterOn "movement", per the 2014 design intent for this timing).
 * The 2024 cast keeps DDB's save for every creature in the sphere, and the region fires a free
 * copy when a creature enters it, the sphere moves into its space, or it ends its turn there; the
 * cloud's own creation does not fire it again ("auto" resolves to "movementOrArea"). The default
 * once-per-turn gate holds a creature to one save a turn, and any creature is affected. Moving the
 * cloud 10 feet away from the caster each turn is left to the table.
 */
export default class Cloudkill extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return castPlacer([
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: ONGOING,
          enterOn: "movement",
        }),
      ]);
    }
    return {
      name: "Cast",
      id: "ddbCloKilSpellSa",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbCloKilZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [ongoingTrigger({ condition: "Enters the cloud for the first time on a turn or starts its turn there" })];
    }
    return [ongoingClone("ddbCloKilZoneSa1", "Enters the cloud, the cloud moves into its space, or it ends its turn there")];
  }

}
