import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverGrazingShot extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once per turn, when you miss with a ranged attack roll",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1@scale.gunslinger.risk.die + @abilities.dex.mod",
              types: ["bludgeoning", "piercing", "slashing"],
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
