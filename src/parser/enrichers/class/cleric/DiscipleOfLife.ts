import DDBEnricherData from "../../data/DDBEnricherData";

export default class DiscipleOfLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  // The bonus itself is automated natively: the feature's transfer effect carries a
  // healing rule of "2 + @item.level" gated on levelled spells (EffectGenerator
  // _addSpellAttackBonuses). This heal activity is a manual claim for tables that
  // disable that effect; using both double-counts the bonus.
  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        consumption: {
          scaling: {
            allowed: true,
            max: "9",
          },
        },
        healing: DDBEnricherData.basicDamagePart({ bonus: "3", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    };
  }

}
