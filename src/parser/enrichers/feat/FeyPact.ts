import Generic from "./Generic";

/** Planar Pact feat: Honeyed Words (DDB's action) rerolls a failed check once per long rest. */
export default class FeyPact extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Honeyed Words",
        max: "1",
        period: "lr",
      }),
    };
  }

}
