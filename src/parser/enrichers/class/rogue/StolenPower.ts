import DDBEnricherData from "../../data/DDBEnricherData";

export default class StolenPower extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      // Sangromancy Dice pool: d8s equal to the Sneak Attack dice count
      uses: {
        max: `@scale.${this.classIdentifier("Rogue")}.sneak-attack.number`,
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
