import Generic from "./Generic";

/**
 * Fading Target is once per long rest and turns you Invisible until the start of your next turn.
 * Nature's Roots' free Entangle cast carries its own use from the spell grant builder.
 */
export default class FeySentinel extends Generic {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fading Target",
        activityMatch: "Fading Target",
        statuses: ["Invisible"],
        // DAE ends it at the start of your next turn; the counted round is its backstop
        options: { expiry: "sourceStart", durationSeconds: 6, durationRounds: 1 },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Fading Target",
        max: "1",
        period: "lr",
      }),
    };
  }

}
