import Generic from "./Generic";

/**
 * Yoka Scout (OTFY): Close Combat Ally regains the Reaction half the Proficiency Bonus times (round
 * down) per Long Rest; DDB sends the count resolved at the character's level, so it is a formula here.
 */
export default class YokaScout extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Close Combat Ally (Regain Reaction)",
        max: "floor(@prof / 2)",
        period: "lr",
      }),
    };
  }

}
