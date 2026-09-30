import Generic from "./Generic";

/** Touch Plant or Tree (DDB's action) can be used twice the Wisdom modifier (minimum 1) times per long rest; the spell casts carry their own uses. */
export default class Plantmender extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Touch Plant or Tree",
        max: "max(1, @abilities.wis.mod * 2)",
        period: "lr",
      }),
    };
  }

}
