import DDBEnricherData from "../../data/DDBEnricherData";

export default class SymbioticBiosphere extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return !this.isAction;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Symbiotic Biosphere",
        includesName: true,
        max: "@abilities.wis.mod",
        period: "lr",
      }),
    };
  }

}
