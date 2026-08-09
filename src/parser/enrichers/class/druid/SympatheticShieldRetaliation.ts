import DDBEnricherData from "../../data/DDBEnricherData";

export default class SympatheticShieldRetaliation extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Retaliation",
      targetType: "creature",
      activationType: "special",
      activationCondition: "A shielded creature is dealt damage by a target within 5 feet of it (14th level, once per round per target)",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

}
