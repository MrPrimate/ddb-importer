import DDBEnricherData from "../../data/DDBEnricherData";

export default class KeeperOfSouls extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "creature",
      addItemConsume: true,
      data: {
        description: {
          chatFlavor: "Enemy dies within 60 feet of you.",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.cleric.levels * 2",
          types: ["healing"],
        }),
      },
    };
  }

}
