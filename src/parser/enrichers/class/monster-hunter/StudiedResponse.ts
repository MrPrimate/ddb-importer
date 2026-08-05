import DDBEnricherData from "../../data/DDBEnricherData";

export default class StudiedResponse extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "reaction",
      activationCondition: "A creature within 60 feet targets you or another creature with an attack; react before the roll to make one weapon or Unarmed Strike attack against it",
      rangeType: "ft",
      rangeValue: 60,
    };
  }

}
