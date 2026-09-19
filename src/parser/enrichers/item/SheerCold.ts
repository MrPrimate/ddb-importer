import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * A natural 20 coats the ground toward the target in ice for 1 minute, as a cone or a line at the
 * wielder's choice, so each shape is its own placer. Both are icy difficult terrain and fire the
 * same slip save for a creature that enters or starts its turn there. The struck target's own
 * save against being frozen in place is rolled by hand.
 */
export default class SheerCold extends DDBEnricherData {

  static BEHAVIORS(): I5eActivityBehavior[] {
    return [
      DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenEnter", "tokenTurnStart"],
        activityName: "Slick Ice Save",
      }),
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const condition = "You rolled a 20 on the d20 for an attack with this weapon";
    return [
      regionPlacer("Slick Ice (Cone)", {
        template: { type: "cone", size: "15" },
        activationType: "special",
        activationCondition: condition,
        duration: { value: "1", units: "minute" },
        behaviors: SheerCold.BEHAVIORS(),
      }),
      regionPlacer("Slick Ice (Line)", {
        template: { type: "line", size: "30", width: "5" },
        activationType: "special",
        activationCondition: condition,
        duration: { value: "1", units: "minute" },
        behaviors: SheerCold.BEHAVIORS(),
      }),
      regionTrigger("Slick Ice Save", {
        condition: "Enters the ice for the first time on a turn or starts its turn there",
        save: { ability: ["dex"], dc: "10" },
      }),
      regionTrigger("Frozen in Place Save", {
        condition: "The target of the attack that rolled the 20",
        save: { ability: ["dex"], dc: "15" },
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Slick Ice Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
      {
        name: "Frozen in Place",
        activityMatch: "Frozen in Place Save",
        statuses: ["Restrained"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Restrained until the start of the wielder's next turn.",
        },
      },
    ];
  }

}
