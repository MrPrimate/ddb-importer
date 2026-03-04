import DDBEnricherData from "../../data/DDBEnricherData";

export default class Ki extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Flurry of Blows", type: "class", rename: ["Flurry of Blows"] }, overrides: { addItemConsume: true } },
      { action: { name: "Patient Defense", type: "class" } },
      { action: { name: "Step of the Wind", type: "class", rename: ["Step of the Wind"] }, overrides: { addItemConsume: true } },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Ki Points",
        max: "@scale.monk.ki-points",
        period: "sr",
      }),
    };
  }

}
