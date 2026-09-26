import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingClone, ongoingTrigger } from "./_SpellRegions";

/**
 * A fixed 5-foot-radius cylinder, not an emanation. The 2014 beam rolls nothing as it appears: the
 * cast only places it, and the region fires "Ongoing Save" when a creature passes into it for the
 * first time on a turn or starts its turn there. Creating the beam on a creature or moving it onto
 * one is not entering (enterOn "movement", per the 2014 design intent for this timing). The 2024
 * cast keeps DDB's save for every creature in the cylinder, and the region fires a free copy when
 * a creature enters it, the beam moves into its space, or it ends its turn there; the beam's own
 * creation does not fire it again ("auto" resolves to "movementOrArea"). The default once-per-turn
 * gate holds a creature to one save a turn, and any creature is affected. Moving the beam means
 * dragging the region; shapechanger Disadvantage is left to the table.
 */
export default class Moonbeam extends DDBEnricherData {

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
      id: "ddbMoonbeamSpSav",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbMoonbeamZone1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [ongoingTrigger({ condition: "Enters the beam for the first time on a turn or starts its turn there" })];
    }
    return [ongoingClone("ddbMoonbeamZone1", "Enters the beam, the beam moves into its space, or it ends its turn there")];
  }

}
