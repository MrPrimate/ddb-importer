import DDBEnricherData from "../../data/DDBEnricherData";

/** The Unbroken Circle: a Bonus Action and a Wild Shape use heal 2d6 + Druid level, 3d6 from level 10 and 4d6 from 14. */
export default class WildRecoveryHealing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "wild-shape",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "(2 + min(1, floor(@classes.druid.levels / 10)) + floor(@classes.druid.levels / 14))d6 + @classes.druid.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
