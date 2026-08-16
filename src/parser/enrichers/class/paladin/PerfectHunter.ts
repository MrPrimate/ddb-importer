import DDBEnricherData from "../../data/DDBEnricherData";

export default class PerfectHunter extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return !this.isAction;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Perfect Hunter",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
