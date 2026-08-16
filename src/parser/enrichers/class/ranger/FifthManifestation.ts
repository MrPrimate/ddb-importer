import DDBEnricherData from "../../data/DDBEnricherData";

export default class FifthManifestation extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return !this.isAction;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "5th Manifestation",
        includesName: true,
        max: "2",
        period: "lr",
      }),
    };
  }

}
