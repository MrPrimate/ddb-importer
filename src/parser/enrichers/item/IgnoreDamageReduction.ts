import DDBEnricherData from "../data/DDBEnricherData";

interface IItemDamageRule {
  /** dnd5e damage types the text names, or "ALL" when the type varies ("the breath weapon's damage type"). */
  types: string | string[];
  /** false when only Resistance is ignored */
  immunity: boolean;
  /**
   * Part of the name of the one activity dealing that damage, when the item has others. Without it
   * every damage roll of the item matches, which suits items whose only damage is the one named.
   */
  activity?: string;
}

/**
 * Items whose own damage "ignores Resistance and Immunity", as dnd5e 6.1 damage application rules
 * on a passive effect scoped to rolls made with the item. The activities stay as the parser built
 * them; keys are matched against the start of the item's DDB name, so weapon variants share a row.
 */
export default class IgnoreDamageReduction extends DDBEnricherData {

  static ITEMS: Record<string, IItemDamageRule> = {
    // the generated "Restriction: Haze ..." attack carries the breath weapon's extra damage
    "Dragon-Kindled Edge": { types: "ALL", immunity: true, activity: "Haze" },
    "Ear Cuff of the Vampire Bat": { types: "necrotic", immunity: true },
    // only the extra fire damage: the weapon's own damage is slashing
    "Eternal Slayer": { types: "fire", immunity: true },
    // the lit hammer's extra fire is the generated "Restriction: when lit ..." attack
    "Forgemaster's Might": { types: "fire", immunity: false, activity: "when lit" },
    "Gauntlets of Eldritch Ferocity": { types: "necrotic", immunity: true },
    "Greaves of Dendallen": { types: "necrotic", immunity: true },
    "Half Plate of the Blind Martyr": { types: "psychic", immunity: true },
    "Necrolace": { types: "necrotic", immunity: true },
  };

  get itemRule(): IItemDamageRule | null {
    const name = `${this.ddbParser?.originalName ?? this.data.name}`.replace(/’/g, "'");
    const key = Object.keys(IgnoreDamageReduction.ITEMS).find((itemName) => name.startsWith(itemName));
    return key ? IgnoreDamageReduction.ITEMS[key] : null;
  }

  override get effects(): IDDBEffectHint[] {
    const rule = this.itemRule;
    if (!rule) return [];
    const conditions: IEffectChangeFilter[] = [this.selfIdentifierFilter];
    if (rule.activity) conditions.push({ k: "activity.name", o: "icontains", v: rule.activity });
    return DDBEnricherData.ignoreDamageReductionEffect(`${this.data.name}: Ignore Damage Reduction`, rule.types, {
      immunity: rule.immunity,
      conditions,
    });
  }

}
