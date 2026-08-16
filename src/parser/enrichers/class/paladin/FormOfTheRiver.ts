import DDBEnricherData from "../../data/DDBEnricherData";

export default class FormOfTheRiver extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return !this.isAction;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Form of the River",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
