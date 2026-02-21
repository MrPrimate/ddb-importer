import DDBEnricherData from "../../data/DDBEnricherData";

export default class FightingSpirit extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
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
