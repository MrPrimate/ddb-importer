import Generic from "./Generic";

/** Boon of Poison Mastery: Perfect Poisoner is once per turn; DDB sends its use with the "Other" reset, which maps to no period. */
export default class BoonOfPoisonMastery extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Perfect Poisoner", max: "1", period: "turn" }),
    };
  }

}
