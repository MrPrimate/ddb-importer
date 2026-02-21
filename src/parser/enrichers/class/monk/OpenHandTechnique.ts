import DDBEnricherData from "../../data/DDBEnricherData";

export default class OpenHandTechnique extends DDBEnricherData {
  get additionalActivities() {
    if (this.is2024) {
      return [
        { action: { name: "Flurry of Blows: Addle", type: "class", rename: ["Addle"] } },
        { action: { name: "Flurry of Blows: Push", type: "class", rename: ["Push"] } },
        { action: { name: "Flurry of Blows: Topple", type: "class", rename: ["Topple"] } },
      ];
    }
    return [];
  }
}
