import DDBEnricherData from "../../data/DDBEnricherData";

export default class BrandOfCastigation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Brand Damage",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "A creature branded by your Crimson Rite weapon damages you",
      allowCritical: false,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.int.mod",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Brand of Castigation",
        max: "1",
        period: "sr",
      }),
    };
  }

}
