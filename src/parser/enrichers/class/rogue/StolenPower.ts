import DDBEnricherData from "../../data/DDBEnricherData";

export default class StolenPower extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get override(): IDDBOverrideData {
    return {
      // Sangromancy Dice pool: d8s equal to the Sneak Attack dice count
      uses: {
        max: "@scale.rogue.sneak-attack.number",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
