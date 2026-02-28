import DDBEnricherData from "../../data/DDBEnricherData";

export default class ActionSurge extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Action Surge",
      activationType: "special",
      targetType: "self",
    };
  }

  get override() {
    return {
      removeDamage: true,
    };
  }

}
