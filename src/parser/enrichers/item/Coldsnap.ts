import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Coldsnap: a charge on a hit against a creature not immune to cold forces a DC 15 Constitution
 * save. On a failure its speed becomes 0 until the start of your next turn; on a success its speed
 * is halved for the same time. The parser builds the save (a charge, no damage); the two outcomes
 * are effects on it, the halving flagged to apply on a successful save.
 */
export default class Coldsnap extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Coldsnap: Frozen",
        activityMatch: "Save",
        changes: [DDBEnricherData.ChangeHelper.customChange("*0", 50, "system.attributes.movement.all")],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Failed the save: speed 0 until the start of the Coldsnap wielder's next turn.",
        },
      },
      {
        name: "Coldsnap: Chilled",
        activityMatch: "Save",
        onSave: true,
        changes: [DDBEnricherData.ChangeHelper.customChange("/2", 50, "system.attributes.movement.all")],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Succeeded on the save: speed halved until the start of the Coldsnap wielder's next turn.",
        },
      },
    ];
  }

}
