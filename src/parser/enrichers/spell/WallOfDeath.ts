import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingTrigger } from "./_SpellRegions";

const BEHAVIORS = (): I5eActivityBehavior[] => [
  DDBEnricherData.BehaviorHelper.activity({
    events: ["tokenEnter", "tokenTurnEnd"],
    activityName: "Wall Damage",
  }),
];

/**
 * The same shape as Wall of Fire: the wall rolls a save as it appears, as a straight wall or a
 * ring, then deals its damage with no save to a creature that enters it or ends its turn inside.
 * The 10-foot band beside the chosen side is wider than the wall and has no region shape, so that
 * arm is rolled by hand from the same activity.
 */
export default class WallOfDeath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Wall",
      data: {
        behaviors: BEHAVIORS(),
        target: {
          override: true,
          template: { type: "wall", size: "60", width: "1", height: "20", units: "ft" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Place Ring", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          targetOverride: {
            override: true,
            // "a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick"
            template: { count: "1", contiguous: false, type: "ring", size: "10", width: "1", height: "20", units: "ft" },
            affects: {},
          },
        },
        overrides: { data: { behaviors: BEHAVIORS() } },
      },
      ongoingTrigger({
        name: "Wall Damage",
        condition: "Enters the wall for the first time on a turn or ends its turn there, or ends its turn within 10 feet of the chosen side",
        noSave: true,
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return { noTemplate: true };
  }

}
