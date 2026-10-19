import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Genie's Limited Wish: once, then not again until 1d4 Long Rests have passed. dnd5e cannot count
 * rests, so the feature has a single use with no automatic recovery for the player to restore.
 */
export default class LimitedWish extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Limited Wish",
      activationType: "action",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "class", name: "Limited Wish", max: "1" }),
    };
  }

}
