import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Harvestborn: a creature touching the ground within 30 feet spends one of its Hit Point Dice and
 * heals the roll plus your proficiency bonus. Its Hit Die is not yours to spend, so the heal rolls
 * your largest as the stand-in.
 */
export default class GiftOfTheGreen extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      activationCondition: "You and the creature both touch the ground; it expends one of its Hit Point Dice",
      addItemConsume: true,
      data: {
        range: { override: true, value: "30", units: "ft" },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@attributes.hd.largest + @prof", types: ["healing"] }),
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "race",
        name: "Gift of the Green",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
