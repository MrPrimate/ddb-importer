import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of the Sea level 10. The benefits only apply while Wrath of the Sea is active, so the
 * WrathOfTheSea enricher carries them as a level-gated effect on its activation; this document
 * is description only.
 */
export default class Stormborn extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [];
  }

}
