import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../data/RegionBuilders";

/**
 * While wielded the halberd is a 10-foot emanation. An ally that starts its turn inside gains
 * 5 feet of Speed for that turn, which the region hands out by firing a free activity against
 * it. The Proficiency Bonus added to saves against the Frightened condition depends on what the
 * save is against, which no effect can test, so it stays a note on the placer.
 */
export default class KnightsStandardOfValor extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Fervor and Valor", {
        template: { type: "radius", size: "10" },
        affects: "ally",
        activationType: "special",
        activationCondition: "While wielding the halberd; you and allies inside add their Proficiency Bonus to saves against the Frightened condition",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Valorous Stride",
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Valorous Stride", {
        affects: "ally",
        condition: "An ally starts its turn within 10 feet of you",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Valorous Stride",
        activityMatch: "Valorous Stride",
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("5", 20)],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Speed increased by 5 feet until the end of the turn.",
        },
      },
    ];
  }

}
