import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Fist of the Frost Jarl: cast with a level 7+ slot it ignores Resistance to Cold damage. dnd5e
 * reports the cast level as `item.level` in the spell's roll data, so the rule checks it.
 */
export default class FistOfTheFrostJarl extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect("Fist of the Frost Jarl: Level 7+", "cold", {
      immunity: false,
      conditions: [this.selfIdentifierFilter, { k: "item.level", o: "gte", v: 7 }],
    });
  }

}
