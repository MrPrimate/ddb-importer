import DDBEnricherData from "../../data/DDBEnricherData";

export default class ViolentAttraction extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature within 60 ft hits with a weapon attack (extra 1d10 of the weapon's type), or a creature takes fall damage (+2d10)",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 10,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
