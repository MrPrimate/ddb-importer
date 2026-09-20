import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../data/RegionBuilders";

/**
 * Caltrops with an acid payload. Spreading the bag places a 5-foot square whose region fires the
 * save against a creature that enters; a failure also rolls on the item's d4 table, which is its
 * own activity so the result is rolled once and read from the description. Only the first entry
 * of that table deals damage, so it gets a roll of its own.
 */
export default class Caltrooze extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Spread Caltroozes", {
      template: { type: "square", size: "5" },
      range: "5",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter"],
          activityName: "Caltrooze Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Caltrooze Save", {
        condition: "Enters the area (Advantage when moving through at half speed)",
        save: { ability: ["dex"], dc: "15" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ bonus: "1", types: ["piercing"] }),
        ],
      }),
      regionTrigger("Corrosive Chaos", {
        condition: "A creature fails the save; the caltroozes are then emptied of acid",
        roll: { prompt: false, visible: false, name: "Corrosive Chaos", formula: "1d4" },
      }),
      regionTrigger("Corrosive Chaos: Acid Burst", {
        condition: "Rolled a 1 on Corrosive Chaos",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, types: ["acid"] }),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Caltrooze: Speed Reduced",
        activityMatch: "Caltrooze Save",
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20)],
        options: {
          transfer: false,
          description: "Stops moving, and walking speed is reduced by 10 feet until the creature regains at least 1 Hit Point.",
        },
      },
    ];
  }

}
