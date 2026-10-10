import DDBEnricherData from "../../data/DDBEnricherData";

/** Circle of Blood: while the Blood Moon is active, weapon and Unarmed Strike hits can deal an extra 2d6 Necrotic. */
export default class BloodLust extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Improved Violent Strikes",
      targetType: "creature",
      activationType: "special",
      activationCondition: "While your Blood Moon is active, you hit a creature with a weapon or Unarmed Strike",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["necrotic"] })],
        },
      },
    };
  }

}
