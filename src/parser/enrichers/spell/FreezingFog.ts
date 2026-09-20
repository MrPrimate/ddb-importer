import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, area, castPlacer, movementBehavior, movementDamage, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. DDB gives the fog no template, so the 20-foot sphere is
 * supplied here. It is difficult terrain, slows a creature that moves in or starts its turn
 * there, and deals cold damage for every 5 feet moved, offered once per movement. The caster is
 * immune to all of it; the two rolls skip the caster, but difficult terrain is ignored by
 * disposition and never by one token.
 */
export default class FreezingFog extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain(),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenMoveIn", "tokenTurnStart"],
        activityName: ONGOING,
        excludeSelf: true,
      }),
      movementBehavior(true),
    ], { target: area("sphere", "20") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Starts its turn in the fog or moves into it",
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
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 50),
        ],
        options: { transfer: false, expiry: "targetEnd", description: "Speed halved until the end of its next turn." },
      },
    ];
  }

}
