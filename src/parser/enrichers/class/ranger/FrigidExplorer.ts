import DDBEnricherData from "../../data/DDBEnricherData";

export default class FrigidExplorer extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

}
