import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * The Bloody End: from the awakened stage, reducing a creature to 0 hit points frightens each
 * creature of your choice within 15 feet on a failed Wisdom save (once per dawn), and a reaction
 * answers a melee hit with psychic damage. Exalted raises the DC to 17 and the damage to 2d6. Its
 * spells import as their own cast activities.
 */
export default class TheBloodyEnd extends WeaponProperties {

  static DREAD = "Dread Presence";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.stage < 1) return [];
    const exalted = this.stage >= 2;
    return [
      itemProperty(TheBloodyEnd.DREAD, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], formula: exalted ? "17" : "15" },
        condition: "You reduce a creature to 0 hit points with an attack using The Bloody End: each creature of your choice within 15 feet",
        template: { type: "radius", size: "15" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dawn" },
      }),
      itemProperty("Bloody Retort", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: exalted ? 2 : 1, denomination: 6, types: ["psychic"] })],
        activationType: "reaction",
        condition: "A creature hits you with a melee attack",
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.stage < 1) return [];
    return [{ name: "Dread Presence", activityMatch: TheBloodyEnd.DREAD, statuses: ["Frightened"], options: { transfer: false, expiry: "sourceEnd" } }];
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
