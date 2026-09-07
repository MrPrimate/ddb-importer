import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The mutagen pool. The known "Formula: <Name>" documents are linked to it via
 * CONSUMPTION_LINKS post-import, so consuming any mutagen spends one of the mutagens
 * concocted on the last rest.
 *
 * The count comes from the Mutagencraft scale value, which tracks the published table: one
 * mutagen at 3rd level, two at 7th and three at 15th, all regained on a short or long rest.
 */
export default class Mutagencraft extends DDBEnricherData {

  static MUTAGENS_CREATED = "@scale.order-of-the-mutant.mutagencraft";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Consume Mutagen",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      noTemplate: true,
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Mutagencraft",
        max: Mutagencraft.MUTAGENS_CREATED,
        period: "sr",
      }),
    };
  }

}
