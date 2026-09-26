import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingClone, ongoingTrigger } from "./_SpellRegions";

/**
 * DDB gives the wall no template, so "Place Wall" places the straight wall and "Place Ring" (a copy
 * of it) the ringed one; both are difficult terrain. The 2014 wall rolls nothing as it appears: the
 * casts only place it, and the region fires "Ongoing Save" when a creature passes into the wall for
 * the first time on a turn or starts its turn there; creating the wall on a creature is not
 * entering (enterOn "movement", per the 2014 design intent for this timing). The 2024 casts keep
 * DDB's save for creatures in the wall, and the region fires a free copy when a creature enters it
 * or ends its turn there, without firing again for the wall's own creation ("auto").
 */
export default class BladeBarrier extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  // DDB provides no template for the wall shapes; give the straight wall so the region has an area
  // to attach to (the ringed wall is the Place Ring activity)
  static WALL_TARGET: I5eActivityTarget = {
    override: true,
    template: {
      count: "1",
      contiguous: false,
      type: "wall",
      size: "100",
      width: "5",
      height: "20",
      units: "ft",
    },
  };

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        ...castPlacer([
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: ONGOING,
            enterOn: "movement",
          }),
        ], { target: BladeBarrier.WALL_TARGET }),
        name: "Place Wall",
      };
    }
    return {
      name: "Place Wall",
      data: {
        target: BladeBarrier.WALL_TARGET,
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbBlaBarZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        // "a ringed wall up to 60 feet in diameter, 20 feet high, and 5 feet thick"
        duplicate: true,
        id: "ddbBlaBarRingPl1",
        overrides: {
          name: "Place Ring",
          data: {
            target: {
              override: true,
              template: {
                count: "1",
                contiguous: false,
                type: "ring",
                size: "30",
                width: "5",
                height: "20",
                units: "ft",
              },
            },
          },
        },
      },
      this.is2014
        ? ongoingTrigger({ condition: "Enters the wall's area for the first time on a turn or starts its turn there" })
        : ongoingClone("ddbBlaBarZoneSa1", "Enters the wall's space or ends its turn there"),
    ];
  }

}
