import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The cantrip grants the Help action; the parser's utility activity carries it and the temporary
 * hit points stay on their own healing activity. AC5e's "once" removes the advantage after the
 * first d20 roll it applies to.
 */
export default class ResilientFriendship extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Resilient Friendship: Help",
        activityTypesMatch: [DDBEnricherData.ACTIVITY_TYPES.UTILITY],
        options: {
          expiry: "sourceStart",
          description: "Advantage on the next ability check or attack roll before the start of the caster's next turn (the benefit of the Help action).",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once", 20, "flags.automated-conditions-5e.d20.advantage"),
        ],
      },
    ];
  }

}
