import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * DDB's three boon actions are kept, with Hell's Assassin and Dark Malediction hidden until the
 * illrigger reaches 13th and 18th level. Veil of Lies gains its invisibility, which ends early on
 * an attack or a spell where DAE can track it.
 */
export default class BelialsInterdiction extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Veil of Lies", type: "class" } },
      {
        action: { name: "Hell's Assassin (Passive)", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(13) },
      },
      {
        action: { name: "Dark Malediction (Passive)", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(18) },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Veil of Lies: Invisible",
        activityMatch: "Veil of Lies",
        statuses: ["Invisible"],
        daeSpecialDurations: ["1Attack", "1Spell"],
        options: {
          durationSeconds: 600,
          description: "Invisible for 10 minutes or until you attack or cast a spell.",
        },
      },
    ];
  }

}
