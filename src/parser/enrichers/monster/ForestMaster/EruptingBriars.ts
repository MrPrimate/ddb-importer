import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * The wall asks for the same DC 15 Dexterity save twice: once where it erupts (the parsed primary)
 * and again from a creature that walks into it later, for a smaller roll. The parser keeps one
 * activity per roll and DC, so the second save and its damage were dropped.
 */
export default class EruptingBriars extends _MonsterFeatureSupport {

  get enterSentence(): string | null {
    return this.sentences(this.text).find((sentence) => (/\benters the wall\b/i).test(sentence)
      && (/saving throw/i).test(sentence)) ?? null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const sentence = this.enterSentence;
    if (!sentence) return [];
    const enter = this.saveExtra("Enter the Briars", "ddbEnterBriars01", sentence, {
      activationOverride: { type: "special", value: null, condition: sentence },
    });
    return enter ? [enter] : [];
  }

}
