import _MonsterFeatureSupport from "../Generic/_MonsterFeatureSupport";

/**
 * Yan-C-Bin's region strikes with lightning and with cyclones, both against the same DC 21
 * Constitution save. The parser keeps one activity per roll and DC, so the cyclone's save and its
 * bludgeoning damage were dropped. The lightning stays the parsed primary.
 */
export default class RegionalEffects extends _MonsterFeatureSupport {

  get cycloneSentence(): string | null {
    const sentences = this.sentences(this.text);
    const cyclone = sentences.findIndex((sentence) => (/\bcyclone\b/i).test(sentence));
    if (cyclone < 0) return null;
    return sentences.slice(cyclone).find((sentence) => (/saving throw/i).test(sentence)) ?? null;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Lightning Strike",
      primaryOnly: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const sentence = this.cycloneSentence;
    if (!sentence) return [];
    const cyclone = this.saveExtra("Cyclone", "ddbYanCBinCyclon", sentence, {
      activationOverride: { type: "special", value: null, condition: "A creature caught in the path of a cyclone." },
    });
    return cyclone ? [cyclone] : [];
  }

}
