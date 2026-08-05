import DDBEnricherData from "../data/DDBEnricherData";

export default class SupremeDisciplineOblivion extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "When a creature you can see within 10 feet of you misses an attack roll",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      data: {
        range: {
          units: "ft",
          value: "10",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, type: "bludgeoning" }),
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, type: "cold" }),
          ],
        },
      },
    };
  }

}
