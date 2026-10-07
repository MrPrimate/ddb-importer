import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * "The grafted target or a creature within 5 feet of the necrohulk can take an action to make a
 * DC 15 Strength (Athletics) check. On a successful check, the target is no longer grafted."
 * Monsters only read an escape from "escape DC N", so this freeing check was never built. It is
 * named as an escape check so the save's Restrained stays off it.
 */
export default class AbsorbBody extends _MonsterFeatureSupport {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const freeing = this.sentences(this.text).find((sentence) => (/\bcheck\b/i).test(sentence) && (/\bDC\s*\d+/).test(sentence));
    const check = freeing ? this.check(freeing) : null;
    if (!check) return [];
    return [
      this.extra("Escape Check", "ddbEscapeGraft01", "check", {
        generateCheck: true,
        checkOverride: check,
        activationOverride: {
          type: "action",
          value: 1,
          condition: "The grafted target or a creature within 5 feet of the necrohulk. On a success, the target is no longer grafted.",
        },
      }),
    ];
  }

}
