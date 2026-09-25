import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Misfortune Bringer rogue: the Jinx Points pool. DDB ships the points as an action hanging off
 * the Misfortunes container; KEEP_ACTIONS builds it as its own document and the Misfortunes,
 * Steal Luck and Curse Caster activities consume it. The max comes from the hand-built jinx-points
 * scale value (see DDBSubClass SPECIAL_ADVANCEMENTS), the spent count from the DDB action.
 */
export default class JinxPoints extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Jinx Points",
        max: "@scale.misfortune-bringer.jinx-points",
        period: "sr",
      }),
    };
  }

}
