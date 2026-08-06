import DDBEnricherData from "../../data/DDBEnricherData";

export default class BadMedicineBonusDamage extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Bad Medicine deals Acid damage to a creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, type: "acid" }),
          ],
        },
      },
    };
  }

}
