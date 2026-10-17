import Generic from "./Generic";

/** Cold Caster: Frostbite is once per turn, but DDB sends its use with the "Other" reset, which maps to no period. */
export default class ColdCaster extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Frostbite", max: "1", period: "turn" }),
    };
  }

}
