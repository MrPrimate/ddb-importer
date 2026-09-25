import Generic from "../Generic";

/**
 * DDB's three boon actions are kept; Veil of Lies gains its invisibility.
 */
export default class BelialsInterdiction extends Generic {

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Veil of Lies: Invisible",
        activityMatch: "Veil of Lies",
        statuses: ["Invisible"],
        options: {
          durationSeconds: 600,
          description: "Invisible for 10 minutes or until you attack or cast a spell.",
        },
      },
    ];
  }

}
