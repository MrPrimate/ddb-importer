/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class PolearmMasterBonusAttack extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      type: "attack",
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
