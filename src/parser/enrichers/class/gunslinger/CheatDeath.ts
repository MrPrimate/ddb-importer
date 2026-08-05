import DDBEnricherData from "../../data/DDBEnricherData";

export default class CheatDeath extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You are reduced to 0 Hit Points but not killed outright",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.gunslinger.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
