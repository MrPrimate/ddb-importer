import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Sword of the Crimson Abbot: +1 Rare, +2 Very Rare, +3 Legendary. Blood Drain's extra necrotic is
 * part of the weapon's damage. The Legendary sword's Embrace of the Duchess touches a Humanoid dead
 * a minute or less: a Charisma save or it rises as a Vampire Spawn until dawn, once per dusk. The
 * "Varies" record is built at the Rare tier.
 */
export default class SwordOfTheCrimsonAbbot extends WeaponProperties {

  get bonus(): number {
    const match = (/, \+(\d)\s*$/).exec(this.recordName);
    return match ? Number(match[1]) : 1;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.bonus < 3) return [];
    return [
      itemProperty("Embrace of the Duchess", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "19" },
        activationType: "action",
        condition: "Touch the sword to a Humanoid dead for 1 minute or less; on a failure it becomes a Vampire Spawn that dies again at dawn",
        range: { value: null, units: "touch" },
        uses: { max: "1", period: "dusk" },
        noeffect: true,
      }),
    ];
  }

}
