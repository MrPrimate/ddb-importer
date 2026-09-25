import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class VengefulShot extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vengeful Shot: Extra Damage",
      ..._Illrigger.sealConsume(),
      activationType: "reaction",
      activationCondition: "A creature makes a ranged attack against you or an ally within 30 feet. Make a ranged weapon attack against the attacker; on a hit add this damage.",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: `floor(${_Illrigger.ILLRIGGER_LEVEL} / 2)`,
        }),
      ],
    };
  }

}
