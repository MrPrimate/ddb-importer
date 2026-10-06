import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, itemUses, noExtraAttackDamage, unrestrictedDamageFormulas, weaponRange } from "./_ItemActivities";

/**
 * Magentan Sun-Saw: a falchion with 7 charges (1d6 + 1 regained at dawn). On a hit you can spend a
 * charge to rip blades of light around the target for an extra 1d6 radiant (2d6 on the very rare
 * variant, whose light is sunlight: a target with Sunlight Sensitivity is in sunlight until the
 * end of its next turn). DDB's radiant modifier put the die on every hit; it is the trigger's own
 * activity instead. DDB's very rare record carries no charges, so they come from the text.
 */
export default class MagentanSunSaw extends WeaponProperties {

  get veryRare(): boolean {
    return (/very rare/i).test(this.recordName) || (/instead of 1d6/i).test(this.text);
  }

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const [number, denomination] = (unrestrictedDamageFormulas(this)[0] ?? (this.veryRare ? "2d6" : "1d6")).replace(/\[.*\]/, "").split("d").map(Number);
    return [
      itemProperty("Sun-Saw Trigger", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number, denomination, types: ["radiant"] })],
        condition: this.veryRare
          ? "When you hit a target with the sword, expend 1 charge. The light is sunlight: a target with Sunlight Sensitivity or Hypersensitivity is in sunlight until the end of its next turn"
          : "When you hit a target with the sword, expend 1 charge",
        range: weaponRange(this),
        charges: "1",
        noeffect: true,
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = (this.ddbParser as DDBItem | undefined)?.data?.system as { uses?: { max?: string | number | null } } | undefined;
    if (uses?.uses?.max) return {};
    return itemUses(this, "7", [{ period: "dawn", type: "formula", formula: "1d6 + 1" }]);
  }

}
