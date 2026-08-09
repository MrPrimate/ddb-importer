import DDBEnricherData from "../../data/DDBEnricherData";

export default class FightingSpirit extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.samurai.fighting-spirit",
          types: ["temphp"],
        }),
      },
    };
  }
}
