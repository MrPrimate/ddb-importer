import DDBEnricherData from "../data/DDBEnricherData";
import HoardItem from "./_HoardItem";
import { itemActivity, itemCast, itemProperty, setItemCastUses, shippedItemSpellNames } from "./_ItemActivities";

/**
 * Dragon-Touched Focus (Fizban's). Slumbering's initiative advantage is a parser modifier. From
 * Stirring it gains one property set by the hoard dragon's family; the record does not say which,
 * so each family's option is offered under its family name:
 * - Chromatic: a d6 added to one damage roll of a slot spell dealing acid, cold, fire, lightning or poison
 * - Gem: a 15-foot teleport after casting a slot spell
 * - Metallic: a reaction granting a creature within 30 feet advantage on a save
 *
 * From Wakened it casts its family's two spells, each once per dawn. Ascendant adds, once per dawn,
 * casting a spell of 1st level or higher as if with a 9th-level slot.
 */
export default class DragonTouchedFocus extends HoardItem {

  static FAMILY_SPELLS: Record<string, string[]> = {
    Chromatic: ["Hold Monster", "Rime's Binding Ice"],
    Gem: ["Rary's Telepathic Bond", "Raulothim's Psychic Lance"],
    Metallic: ["Fizban's Platinum Shield", "Legend Lore"],
  };

  get stirringActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Chromatic: Draconic Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["acid", "cold", "fire", "lightning", "poison"] })],
        condition: "You use a spell slot to cast a spell that deals acid, cold, fire, lightning, or poison damage: add the roll to one of its damage rolls",
        noeffect: true,
      }),
      itemActivity("Gem: Teleport", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: { type: "special", value: null, condition: "Immediately after you use a spell slot to cast a spell" },
        rangeOverride: { value: "15", units: "ft" },
      }),
      itemActivity("Metallic: Advantage on a Save", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: { type: "reaction", value: 1, condition: "A creature you can see within 30 feet of you makes a saving throw: it has advantage" },
        rangeOverride: { value: "30", units: "ft" },
        targetOverride: { affects: { type: "creature", count: "1", choice: false }, template: { type: "" } },
      }),
    ];
  }

  get wakenedCasts(): IDDBAdditionalActivity[] {
    const shipped = shippedItemSpellNames(this);
    return Object.entries(DragonTouchedFocus.FAMILY_SPELLS).flatMap(([family, spells]) => spells
      .filter((spell) => !shipped.includes(spell))
      .map((spell) => {
        const cast = itemCast(spell);
        // the family suffix names whose hoard the spell belongs to; setItemCastUses strips it
        return { ...cast, init: { ...cast.init, name: `${spell} (${family})` } } as IDDBAdditionalActivity;
      }));
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.stage >= 1) activities.push(...this.stirringActivities);
    if (this.stage >= 2) activities.push(...this.wakenedCasts);
    if (this.stage >= 3) {
      activities.push(HoardItem.oncePerDawn(itemActivity("Ascendant Casting", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: {
          type: "special",
          value: null,
          condition: "You cast a spell of 1st level or higher while holding the focus: treat it as cast with a 9th-level spell slot",
        },
      })));
    }
    return activities;
  }

  override async cleanup(): Promise<void> {
    if (this.stage < 2) return;
    setItemCastUses(this.data, { limited: Object.values(DragonTouchedFocus.FAMILY_SPELLS).flat() });
  }

}
