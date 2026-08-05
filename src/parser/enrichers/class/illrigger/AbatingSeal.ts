import DDBEnricherData from "../../data/DDBEnricherData";

export default class AbatingSeal extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Reduce Damage",
      targetType: "creature",
      targetCount: 1,
      activationType: "reaction",
      activationCondition: "An interdicted creature damages a target; expend a seal to reduce the damage",
      addItemConsume: true,
      itemConsumeTargetName: "Baleful Interdict",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "floor(@classes.illrigger.levels / 2)",
          types: ["healing"],
        }),
      },
    };
  }

}
