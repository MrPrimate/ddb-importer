import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadfulStrikeMassFear extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use the Dreadful Strike effect",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Dreadful Strike: Fear",
      options: {
        durationSeconds: 6,
      },
      statuses: ["Frightened"],
    }];
  }

}
