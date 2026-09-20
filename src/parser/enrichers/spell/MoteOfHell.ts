import DDBEnricherData from "../data/DDBEnricherData";
import { area, castPlacer, ongoingTrigger } from "./_SpellRegions";

/**
 * Nothing is rolled as the spell is cast. DDB records the 30 feet the screams carry as the area;
 * the cloud itself is a 15-foot-radius sphere. Inside it is difficult terrain and blinding, fire
 * burns a creature that starts its turn there with no save, and one that ends its turn there
 * saves against the psychic damage. Each roll takes its own DDB damage part.
 */
export default class MoteOfHell extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.difficultTerrain(),
      DDBEnricherData.BehaviorHelper.applyEffect({ effects: DDBEnricherData.SRDEffects.condition("blinded") }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnStart"],
        activityName: "Hellfire Damage",
      }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnEnd"],
        activityName: "Voices of the Damned Save",
      }),
    ], { target: area("sphere", "15") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Hellfire Damage",
        condition: "Starts its turn in the cloud",
        noSave: true,
        damageParts: [0],
      }),
      ongoingTrigger({
        name: "Voices of the Damned Save",
        condition: "Ends its turn in the cloud",
        damageParts: [1],
      }),
    ];
  }

  // the parsed Blinded effect would ride on the save; the region applies the stock one instead
  override get clearAutoEffects(): boolean {
    return true;
  }

}
