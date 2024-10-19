/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class AbjureFoes extends DDBEnricherMixin {

  get activity() {
    return {
      type: "none",
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Channel Divinity: Abjure Foes", type: "class", rename: ["Save vs Frightened"] } },
    ];
  }

}
