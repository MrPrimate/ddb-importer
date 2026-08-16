import DDBEnricherData from "../../data/DDBEnricherData";

export default class AvatarOfNourishment extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return !this.isAction;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Avatar of Nourishment",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
