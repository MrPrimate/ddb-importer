import Generic from "./Generic";

/** Action Hero: Heroic Moment is the first failed Athletics check each day; DDB sends its use with the "Other" reset. */
export default class ActionHero extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Heroic Moment", max: "1", period: "day" }),
    };
  }

}
