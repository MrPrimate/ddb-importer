import DDBEnricherData from "../../data/DDBEnricherData";

/** Path of the Juggernaut: melee weapon attacks deal an extra 1d8 to constructs (and double damage to objects and structures). */
export default class DemolishingMight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "You hit a construct with a melee weapon attack",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8 })],
        },
      },
    };
  }

}
