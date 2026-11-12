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

  // a getter: the subclass identifier depends on the dnd5e version, unknown at module load
  static get MUTAGENS_CREATED(): string {
    return `@scale.${DDBEnricherData.subclassIdentifier("Order of the Mutant")}.mutagencraft`;
  }

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
