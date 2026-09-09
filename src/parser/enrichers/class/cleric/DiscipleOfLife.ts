import DDBEnricherData from "../../data/DDBEnricherData";

export default class DiscipleOfLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  // The DDB "spell-group-healing" modifier is baked into the feature's transfer effect as a
  // system.bonuses.heal.damage change of "<bonus> + @item.level" (EffectGenerator
  // _addSpellAttackBonuses). dnd5e 5.3 has no change conditions, so that bonus cannot be limited
  // to levelled spells. This heal activity is a manual claim for tables that disable the effect;
  // using both double-counts the bonus.
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
