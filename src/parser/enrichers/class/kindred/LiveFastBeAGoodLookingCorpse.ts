import DDBEnricherData from "../../data/DDBEnricherData";

export default class LiveFastBeAGoodLookingCorpse extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return !this.isAction;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Live Fast, Be a Good Looking Corpse",
        includesName: true,
        max: "@prof",
      }),
    };
  }

}
