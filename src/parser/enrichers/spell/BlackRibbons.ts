import DDBEnricherData from "../data/DDBEnricherData";
import { ONGOING, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: the ribbons are difficult terrain and catch a creature
 * that ends its turn among them. One success makes a creature immune to being restrained again,
 * which is left to the table.
 */
export default class BlackRibbons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain(),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnEnd"],
        activityName: ONGOING,
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        condition: "Ends its turn in the area; a creature that has saved once can't be restrained again",
        noDamage: true,
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activityMatch: ONGOING,
        statuses: ["Restrained"],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Restrained by the ribbons until the end of its next turn.",
        },
      },
    ];
  }

}
