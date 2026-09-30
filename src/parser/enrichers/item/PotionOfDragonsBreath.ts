import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import { itemText } from "./_ItemActivities";

const BREATH_DAMAGE_TYPES = ["acid", "cold", "fire", "lightning", "poison"];

/**
 * Two unrelated items share this name. One grants the Dragon's Breath spell for a minute (3d6, DC 13,
 * a Bonus Action each turn). The other, printed with Uncommon, Rare and Very Rare variants, lets you
 * replace one attack within the next minute with a Dragonborn-style Breath Weapon whose damage and DC
 * follow the potion's rarity, as a 15-foot Cone or a 30-foot Line.
 */
export default class PotionOfDragonsBreath extends DDBEnricherData {

  static BREATH_WEAPON_TIERS: Record<string, { number: number; dc: number }> = {
    "uncommon": { number: 2, dc: 13 },
    "rare": { number: 3, dc: 15 },
    "very rare": { number: 4, dc: 16 },
  };

  get isBreathWeaponPrinting(): boolean {
    return (/Breath Weapon/i).test(itemText(this));
  }

  /** The rarity row of the table; the "Varies" parent listing takes the Uncommon row. */
  get breathTier(): { number: number; dc: number; known: boolean } {
    const rarity = String((this.ddbParser as DDBItem).ddbDefinition.rarity ?? "").toLowerCase();
    const tier = PotionOfDragonsBreath.BREATH_WEAPON_TIERS[rarity];
    return tier ? { ...tier, known: true } : { ...PotionOfDragonsBreath.BREATH_WEAPON_TIERS["uncommon"], known: false };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get _breathWeaponActivity(): IDDBActivityData {
    const tier = this.breathTier;
    const condition = "Replaces one attack of the Attack action, once within 1 minute of drinking";
    return {
      name: "Exhale (Cone)",
      targetType: "creature",
      activationType: "special",
      activationCondition: tier.known
        ? condition
        : `${condition}; Uncommon shown (Rare 3d10, DC 15; Very Rare 4d10, DC 16)`,
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: String(tier.dc) } },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: tier.number,
              denomination: 10,
              types: BREATH_DAMAGE_TYPES,
              scalingMode: "none",
            }),
          ],
        },
        range: { units: "self" },
        target: {
          affects: { type: "creature" },
          template: { type: "cone", size: "15", units: "ft" },
        },
      },
    };
  }

  override get activity(): IDDBActivityData {
    if (this.isBreathWeaponPrinting) return this._breathWeaponActivity;
    return {
      name: "Exhale Breath",
      targetType: "creature",
      activationType: "bonus",
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "13" } },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 6,
              types: BREATH_DAMAGE_TYPES,
              scalingMode: "none",
            }),
          ],
        },
        range: { units: "self" },
        target: {
          affects: { type: "creature" },
          template: { type: "cone", size: "15", units: "ft" },
        },
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.isBreathWeaponPrinting) return [];
    return [
      {
        duplicate: true,
        overrides: {
          name: "Exhale (Line)",
          data: {
            target: {
              affects: { type: "creature" },
              template: { type: "line", size: "30", width: "5", units: "ft" },
            },
          },
        },
      },
    ];
  }

}
