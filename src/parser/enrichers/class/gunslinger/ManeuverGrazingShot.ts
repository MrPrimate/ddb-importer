import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverGrazingShot extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      rangeType: "any",
      activationType: "special",
      activationCondition: "Once per turn, when you miss with a ranged attack roll",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1@scale.gunslinger.risk.die + max(1, @abilities.dex.mod)",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
          critical: {
            allow: false,
          },
        },
      },
    };
  }

}
