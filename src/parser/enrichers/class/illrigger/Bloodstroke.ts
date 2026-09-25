import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class Bloodstroke extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bloodstroke",
      activationType: "special",
      activationCondition: "When an ally with temporary hit points from Exsanguinate is hit by a melee attack",
      targetType: "creature",
      targetCount: 1,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: _Illrigger.ILLRIGGER_LEVEL,
          types: ["cold", "fire", "necrotic"],
        }),
      ],
    };
  }

}
