import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Unstable Crumbler, a trick weapon DDB ships as a Cannon record, a Maul record and a parent that
 * describes both. While held, fire damage the wielder takes is reduced by their Constitution
 * modifier (minimum 1).
 *
 * - Cannon: a ranged attack roll of 15 or more overheats the cannonball into an Explosive
 *   Cannonball: each creature within 10 feet of the hit target makes a Dexterity save against
 *   8 + Strength modifier + proficiency or takes 2d8 fire.
 * - Maul: an attack roll of 18 or more detonates the head as Fireball (DC 15) on the target: 8d6
 *   fire in a 20 foot radius, half on a success; the wielder takes nothing on a success.
 */
export default class UnstableCrumbler extends DDBEnricherData {

  get form(): "cannon" | "maul" | "both" {
    const name = this.ddbParser?.originalName ?? this.name;
    if ((/\(Cannon\)/i).test(name)) return "cannon";
    if ((/\(Maul\)/i).test(name)) return "maul";
    return "both";
  }

  // the parent record is a wondrous item describing both forms; it has no attack of its own
  override get stopDefaultActivity(): boolean {
    return this.form === "both";
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.form !== "maul") {
      activities.push(itemProperty("Overheated Cannonball", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], calculation: "str" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["fire"] })],
        condition: "A ranged attack roll of 15 or higher on the d20 that hits; each creature within 10 feet of the target",
        template: { type: "radius", size: "10" },
        range: { value: "60", units: "ft" },
        noeffect: true,
      }));
    }
    if (this.form !== "cannon") {
      activities.push(itemProperty("Detonation", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, types: ["fire"] })],
        onSave: "half",
        condition: "An attack roll of 18 or higher on the d20 with the Maul; Fireball centred on the target. If you succeed on the save you take no damage",
        template: { type: "radius", size: "20" },
        range: { value: "5", units: "ft" },
        noeffect: true,
      }));
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unstable Crumbler: Fire Reduction",
        options: {
          transfer: true,
          description: "While holding the weapon, fire damage you take is reduced by your Constitution modifier (minimum of 1).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-max(@abilities.con.mod, 1)", 20, "system.traits.dm.amount.fire"),
        ],
      },
    ];
  }

}
