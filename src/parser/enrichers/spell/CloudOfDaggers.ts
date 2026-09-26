import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingClone, ongoingTrigger } from "./_SpellRegions";

/**
 * A fixed 5-foot cube of daggers. The 2014 cube deals nothing as it appears: the cast only places
 * it, and the region fires "Ongoing Damage" (no save) when a creature passes into it for the first
 * time on a turn or starts its turn there; creating the cube on a creature or moving it onto one
 * is not entering (enterOn "movement", per the 2014 design intent for this timing). The 2024 cast
 * keeps DDB's damage to each creature in the cube, and the region deals it again when a creature
 * enters the cube, the cube moves into its space, or it ends its turn there, without dealing it
 * again for the cube's own creation ("auto" resolves to "movementOrArea").
 */
export default class CloudOfDaggers extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return castPlacer([
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Ongoing Damage",
          enterOn: "movement",
        }),
      ]);
    }
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbCloDagZoneDa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [ongoingTrigger({
        name: "Ongoing Damage",
        noSave: true,
        condition: "Enters the cube for the first time on a turn or starts its turn there",
      })];
    }
    return [ongoingClone("ddbCloDagZoneDa1", "Enters the cube, the cube moves into its space, or it ends its turn there", "Ongoing Damage")];
  }

}
