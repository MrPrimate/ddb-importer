import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** These checks are rolled by the observer, against the DC in this monster's description. */
export default class ObserverCheck extends _MonsterFeatureSupport {
  override get type(): IDDBActivityType | null {
    return this.check() ? "check" : null;
  }

  override get activity(): IDDBActivityData | null {
    const check = this.check();
    return check
      ? {
        name: this.key === "Mimicry" ? "Discern Imitation" : "Notice Creature",
        activationType: "special",
        noConsumeTargets: true,
        noTemplate: true,
        activationCondition: "The observer makes this check when the conditions in the description apply.",
        data: { check },
      }
      : null;
  }
}
