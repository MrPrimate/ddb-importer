import DDBEnricherData from "../../data/DDBEnricherData";

export default class FrostsChill extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "cold",
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-10", 20, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "race",
        name: this.ddbParser.originalName,
        max: "@prof",
        period: "lr",
      }),
    };
  }
}
