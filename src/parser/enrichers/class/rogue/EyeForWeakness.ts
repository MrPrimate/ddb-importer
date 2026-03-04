import DDBEnricherData from "../../data/DDBEnricherData";

export default class EyeForWeakness extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      name: "Bonus Damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 6,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
