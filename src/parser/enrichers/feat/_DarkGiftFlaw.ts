import DDBEnricherData from "../data/DDBEnricherData";

interface IDarkGiftFlaw {
  ability: string;
  condition: string;
  /** the effect a failed save applies, if any */
  effect?: IDDBEffectHint;
}

/**
 * Ravenloft Dark Gift flaws: DDB ships each as a bare action, but the text is a save against
 * DC 13 plus your Proficiency Bonus, made by you, with a condition on a failure.
 */
export default abstract class _DarkGiftFlaw extends DDBEnricherData {

  abstract flaw: IDarkGiftFlaw;

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: this.flaw.condition,
      overrideActivation: true,
      targetSelf: true,
      rangeSelf: true,
      noConsumeTargets: true,
      data: {
        save: { ability: [this.flaw.ability], dc: { calculation: "", formula: "13 + @prof" } },
      },
    };
  }

  // the flaw's effect lands on the feat beside the other benefits' actions, so only its save takes it
  override get effects(): IDDBEffectHint[] {
    return this.flaw.effect ? [{ activityTypesMatch: ["save"], ...this.flaw.effect }] : [];
  }

}
