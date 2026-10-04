import DDBEnricherData from "../../data/DDBEnricherData";

/** Grim Hollow human: a hit on a creature that hasn't taken a turn in the combat yet deals 2d6 extra damage, proficiency bonus times per long rest. */
export default class FirstStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "You hit a creature that hasn't taken a turn in the combat yet",
      addItemConsume: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6 })],
        },
      },
    };
  }

}
