import DDBEnricherData from "../../data/DDBEnricherData";

export default class PhantomPossession extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Phantom Possession",
        max: "1",
        period: "sr",
      }),
    };
  }

}
