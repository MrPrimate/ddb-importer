import Generic from "../generic/Generic";

/**
 * Ram (Bariaur, D&D Beyond Drops November 2026): a once-per-turn rider on an Unarmed Strike made
 * as part of the Attack action after moving 10 feet straight at the target, using both the Damage
 * and Shove options. DDB sends it as an Action, so the activity moves to a special activation with
 * the trigger.
 */
export default class Ram extends Generic {

  // the trait itself builds nothing: its one activity comes from the DDB action
  override get type(): IDDBActivityType | null {
    return this.isAction ? Generic.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      activationType: "special",
      activationCondition: "You hit with an Unarmed Strike as part of the Attack action after moving 10+ feet straight toward the target (once per turn)",
      targetType: "creature",
      data: {
        range: {
          units: "touch",
        },
      },
    };
  }

}
