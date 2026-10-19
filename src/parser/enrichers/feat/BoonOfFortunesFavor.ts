import Generic from "./Generic";

/**
 * Boon of Fortune's Favor: Saving Throw Reroll comes back at the start of your next turn; DDB sends its use with the
 * "Other" reset, which maps to no period.
 */
export default class BoonOfFortunesFavor extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Saving Throw Reroll", max: "1", period: "turnStart" }),
    };
  }

}
