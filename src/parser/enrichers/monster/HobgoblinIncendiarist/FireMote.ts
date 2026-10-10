import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * The mote asks the target and then everyone around it for the same DC 13 Dexterity save, with a
 * smaller roll for the splash. The parser keeps one activity per roll and DC, so the splash save
 * and its damage were dropped.
 */
export default class FireMote extends _MonsterFeatureSupport {

  get splashSentence(): string | null {
    return this.sentences(this.text).find((sentence) => (/\bother creatures within \d+ feet of the target\b/i).test(sentence)
      && (/saving throw/i).test(sentence)) ?? null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const sentence = this.splashSentence;
    if (!sentence) return [];
    const radius = sentence.match(/within (\d+) feet of the target/i)?.[1] ?? "";
    const splash = this.saveExtra("Splash", "ddbFireMoteSpl01", sentence, {
      activationOverride: { type: "special", value: null, condition: "Everyone else around the mote's target." },
      // the burst follows the target, so it is an emanation placed on that token
      targetOverride: _MonsterFeatureSupport.targetWith({ type: "creature" }, radius ? { type: "radius", size: radius } : null),
    });
    return splash ? [splash] : [];
  }

}
