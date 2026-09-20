import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast: a creature that ends its turn in the fog takes the
 * psychic damage, with no save.
 */
export default class CreateMistOfRlyeh extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnEnd"],
        activityName: "Mist Damage",
      }),
    ]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Mist Damage",
        condition: "Ends its turn in the fog",
        noSave: true,
      }),
    ];
  }

}
