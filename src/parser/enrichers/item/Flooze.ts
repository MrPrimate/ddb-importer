import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import WeaponProperties from "./_WeaponProperties";
import { itemCheck, itemProperty, textDC } from "./_ItemActivities";

/**
 * Flooze: extra acid damage by rarity, 1d6 to the first target hit each turn (Uncommon, Rare) or
 * 1d8 on every hit (Very Rare). Reachier spends up to 4 charges for 5 feet of reach each until the
 * end of the turn. The Very Rare flail's Sticky Fingers disarms instead of dealing damage (Strength
 * save), and freeing the stuck item is a Strength check that burns whoever tries it with acid
 * either way.
 */
export default class Flooze extends WeaponProperties {

  /**
   * The record's extra acid. The dice come from DDB's damage modifier, since the unsuffixed record's
   * text only says "dependent on rarity"; DDB restricts the first-target dice to a Restricted
   * Attack, which this base does not build.
   */
  get acid(): { part: I5eDamagePart; everyHit: boolean } {
    const dice = ((this.ddbParser as DDBItem | undefined)?.ddbDefinition.grantedModifiers ?? [])
      .find((mod) => mod.type === "damage" && mod.subType === "acid" && mod.dice?.diceCount)?.dice;
    const everyHit = (/acid damage to any target it hits/i).test(this.text);
    return {
      part: DDBEnricherData.basicDamagePart({
        number: dice?.diceCount ?? 1,
        denomination: dice?.diceValue ?? (everyHit ? 8 : 6),
        types: ["acid"],
      }),
      everyHit,
    };
  }

  // the parser leaves the Very Rare acid off the attack, because Sticky Fingers' save in the text
  // marks the weapon as a save item
  override get activity(): IDDBActivityData {
    const acid = this.acid;
    if (!acid.everyHit) return { noeffect: true };
    return { noeffect: true, data: { damage: { includeBase: true, parts: [acid.part] } } };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const acid = this.acid;
    const activities: IDDBAdditionalActivity[] = [];
    if (!acid.everyHit) {
      activities.push(itemProperty("Acid Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [acid.part],
        condition: "The first target you hit with the flail on each of your turns",
        noeffect: true,
      }));
    }
    activities.push(
      itemProperty("Reachier", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "No action required: +5 feet of reach per charge until the end of your turn",
        charges: "1",
        scalingMax: "4",
        selfTarget: true,
        noeffect: true,
      }),
    );
    if ((/Sticky Fingers/i).test(this.text)) {
      const dc = textDC(this.text, /DC (\d+) Strength saving throw/i, "16");
      activities.push(
        itemProperty("Sticky Fingers", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
          save: { ability: ["str"], formula: dc },
          condition: "Instead of dealing damage when you hit a Medium or smaller creature holding an item: it lets go and the item sticks in the flail",
          noeffect: true,
        }),
        itemCheck("Free the Stuck Item", {
          ability: "str",
          dc,
          condition: "A creature within reach of the flooze",
        }),
        itemProperty("Free the Stuck Item: Acid", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["acid"] })],
          condition: "The creature taking the action to free the item, success or failure",
          noeffect: true,
        }),
      );
    }
    return activities;
  }

}
