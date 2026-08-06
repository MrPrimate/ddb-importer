import DDBEnricherData from "../../data/DDBEnricherData";

export default class FullBlooded extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1 + @classes.wizard.levels",
        recovery: [
          { period: "lr", type: "recoverAll", formula: "" },
          { period: "sr", type: "formula", formula: "1" },
        ],
      },
    };
  }

}
