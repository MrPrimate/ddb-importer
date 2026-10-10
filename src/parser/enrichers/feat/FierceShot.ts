import DDBEnricherData from "../data/DDBEnricherData";

/** The One Ring virtue: after moving no more than half your speed, a bonus action adds 1d4 of the weapon's damage type to a ranged weapon hit. */
export default class FierceShot extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      activationCondition: "You hit with a ranged weapon attack after moving no more than half your speed this turn",
      noTemplate: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning", "piercing", "slashing"] })],
        },
      },
    };
  }

}
