/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

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
