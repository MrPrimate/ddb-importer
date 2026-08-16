import DDBEnricherData from "../../data/DDBEnricherData";

export default class MythicSwashbuckler extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return !this.isAction;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Mythic Swashbuckler",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
