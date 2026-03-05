import DDBEnricherData from "../../data/DDBEnricherData";

export default class FightingSpirit extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
