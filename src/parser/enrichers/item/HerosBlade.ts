import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hero's Blade: poured over a weapon, it gives the weapon +3 to attack and damage rolls for a
 * minute (the Oil of Sharpness idiom). Hits also ignore damage immunities and resistances for that
 * minute, which dnd5e cannot express on the weapon, so that part stays in the description.
 */
export default class HerosBlade extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      allowMagical: true,
      data: {
        // dnd5e 6.0 stamps the enchant activity's duration onto the applied enchantment
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        magicalBonus: {
          bonus: "3",
          nameAddition: "Hero's Blade",
        },
        options: {
          description: "+3 to attack and damage rolls. Creatures hit by this weapon don't benefit from damage immunities or resistances for 1 minute.",
        },
      },
    ];
  }

}
