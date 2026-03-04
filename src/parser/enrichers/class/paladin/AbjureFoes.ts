import DDBEnricherData from "../../data/DDBEnricherData";

export default class AbjureFoes extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Channel Divinity: Abjure Foes", type: "class", rename: ["Save vs Frightened"] } },
    ];
  }

}
