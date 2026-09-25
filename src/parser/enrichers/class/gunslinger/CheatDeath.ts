import DDBEnricherData from "../../data/DDBEnricherData";

export default class CheatDeath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeType: "self",
      activationType: "special",
      activationCondition: "You are reduced to 0 Hit Points but not killed outright; apply this healing from 0 HP (includes the 1 HP you drop to)",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1 + @classes.gunslinger.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
