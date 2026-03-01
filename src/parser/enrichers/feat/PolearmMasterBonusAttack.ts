import DDBEnricherData from "../data/DDBEnricherData";

export default class PolearmMasterBonusAttack extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
      activationType: "bonus",
      targetType: "creature",
      data: {
        "reach.value": "10",
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 4,
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return null;
  }
}
