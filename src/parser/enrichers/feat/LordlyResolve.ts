import Generic from "./Generic";

/** Lords' Alliance feat: Standard Bearer (DDB's action) is once per long rest. */
export default class LordlyResolve extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Standard Bearer",
        max: "1",
        period: "lr",
      }),
    };
  }

}
