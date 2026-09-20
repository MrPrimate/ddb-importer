import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../data/RegionBuilders";

/**
 * Drinking the potion rolls nothing: it fills a 20-foot cube with bubbles for 1 hour, and the
 * region fires the save against a creature that enters. A failure bursts the bubbles on everyone
 * inside the cube, not only the creature that saved, so the other targets are added by hand.
 */
export default class TinyBubbles extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Drink", {
      template: { type: "cube", size: "20" },
      range: "30",
      activationType: "bonus",
      duration: { value: "1", units: "hour" },
      consume: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter"],
          activityName: "Bubbles Burst Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Bubbles Burst Save", {
        condition: "Enters a space of bubbles for the first time on a turn; a failure damages every creature inside the cube",
        save: { ability: ["dex"], dc: "13" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["thunder"] }),
        ],
      }),
    ];
  }

}
