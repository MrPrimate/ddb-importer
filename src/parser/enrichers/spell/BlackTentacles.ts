import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingClone, ongoingTrigger } from "./_SpellRegions";

/**
 * Evard's Black Tentacles: a fixed 20-foot square of difficult terrain. The 2014 tentacles roll
 * nothing as they appear: the cast only places the area, and the region fires "Ongoing Save" when
 * a creature passes into it for the first time on a turn or starts its turn there; creating the
 * area on a creature is not entering (enterOn "movement", per the 2014 design intent for this
 * timing). The 2014 damage to a creature that starts its turn already restrained is left to the
 * table. The 2024 cast keeps DDB's save for each creature in the area, and the region fires a
 * free copy when a creature enters it or ends its turn there, without firing again for the area's
 * own creation ("auto").
 */
export default class BlackTentacles extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return castPlacer([
        DDBEnricherData.BehaviorHelper.difficultTerrain(),
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: ONGOING,
          enterOn: "movement",
        }),
      ]);
    }
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbBlaTenZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [ongoingTrigger({ condition: "Enters the area for the first time on a turn or starts its turn there" })];
    }
    return [ongoingClone("ddbBlaTenZoneSa1", "Enters the area or ends its turn there")];
  }

}
