import DDBEnricherData from "../data/DDBEnricherData";

export default class Charger extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      data: {
        name: "Charge Damage",
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: DDBEnricherData.allDamageTypes() })],
        },
      },
    };
  }

}
