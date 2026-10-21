import DDBEnricherData from "../../data/DDBEnricherData";

/** Harvest Domain Bountiful Harvest, Sowing: up to six creatures within 60 feet gain proficiency bonus plus Wisdom modifier Temporary Hit Points. */
export default class SowingBountifulHarvest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 6,
      targetChoice: true,
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "channel-divinity-cleric",
      data: {
        range: { override: true, value: "60", units: "ft" },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@prof + @abilities.wis.mod", types: ["temphp"] }),
      },
    };
  }

}
