import DDBEnricherData from "../../data/DDBEnricherData";

export default class FullBlooded extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: `1 + @classes.${this.classIdentifier("Wizard")}.levels`,
        recovery: [
          { period: "lr", type: "recoverAll", formula: "" },
          { period: "sr", type: "formula", formula: "1" },
        ],
      },
    };
  }

}
