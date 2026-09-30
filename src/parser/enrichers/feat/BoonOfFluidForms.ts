import Generic from "./Generic";

/** Epic boon: Shapechanger (DDB's action) is once per long rest. */
export default class BoonOfFluidForms extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Shapechanger",
        max: "1",
        period: "lr",
      }),
    };
  }

}
