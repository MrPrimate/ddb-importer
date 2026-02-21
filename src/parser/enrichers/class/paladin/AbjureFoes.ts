import DDBEnricherData from "../../data/DDBEnricherData";

export default class AbjureFoes extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Channel Divinity: Abjure Foes", type: "class", rename: ["Save vs Frightened"] } },
    ];
  }

}
