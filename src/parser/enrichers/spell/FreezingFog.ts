import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, area, castPlacer, movementDamage, ongoingTrigger } from "./_SpellAreas";

/**
 * Nothing is rolled as the spell is cast. DDB gives the fog no template, so the 20-foot sphere is
 * supplied here. It is difficult terrain, slows a creature that moves in or starts its turn
 * there, and deals cold damage for every 5 feet moved, rolled by hand. The caster is immune to
 * all of it.
 */
export default class FreezingFog extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer({ target: area("sphere", "20") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "A creature other than you starts its turn in the fog or moves into it",
        noDamage: true,
      }),
      movementDamage("2d4 Cold"),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Freezing Fog: Slowed",
        activityMatch: ONGOING,
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 50, "system.attributes.movement.all"),
        ],
        options: {
          transfer: false,
          expiry: "targetEnd",
          durationSeconds: 6,
          durationRounds: 1,
          description: "Speed halved until the end of its next turn.",
        },
      },
    ];
  }

}
