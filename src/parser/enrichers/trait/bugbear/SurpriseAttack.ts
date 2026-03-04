import DDBEnricherData from "../../data/DDBEnricherData";

export default class SurpriseAttack extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6 })],
        },
      },
    };
  }

  get effects() {
    return [];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  get override() {
    return null;
  }

}
