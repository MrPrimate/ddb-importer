import DDBEnricherData from "../../data/DDBEnricherData";

export default class AbjureFoes extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Channel Divinity: Abjure Foes", type: "class", rename: ["Save vs Frightened"] } },
    ];
  }

}
