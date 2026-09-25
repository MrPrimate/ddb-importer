import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class SoulEater extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Soul Eater",
      activationType: "special",
      activationCondition: "When you burn a seal on an interdicted creature (no action required)",
      targetType: "self",
      rangeSelf: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: _Illrigger.ILLRIGGER_LEVEL,
          types: ["temphp"],
        }),
      },
    };
  }

}
