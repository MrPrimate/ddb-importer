import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Heaven's Guard level 7. A Bonus Action flight of twice the magus's Speed, after which chosen
 * creatures within 10 feet regain Magus level plus Intelligence modifier Hit Points; once per
 * Short or Long Rest.
 */
export default class GuardiansWings extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Guardian's Wings",
      activationType: "bonus",
      activationCondition: "Fly up to twice your Speed; the healing happens at the end of your turn",
      addItemConsume: true,
      targetType: "creature",
      targetChoice: true,
      data: {
        range: { units: "self" },
        target: {
          template: { type: "radius", size: "10", units: "ft", contiguous: false, count: "", width: "", height: "" },
          affects: { type: "creature", choice: true, count: "", special: "" },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.magus.levels + @abilities.int.mod",
          types: ["healing"],
          scalingMode: "none",
        }),
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Guardian’s Wings",
        max: "1",
        period: "sr",
      }),
    };
  }

}
