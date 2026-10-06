import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Sword of the Crimson Abbot: +1 Rare, +2 Very Rare, +3 Legendary. Blood Drain (Rare+, so every
 * tier) adds 1d6 necrotic to each hit, built onto the weapon attack. The Legendary sword's Embrace
 * of the Duchess touches a Humanoid dead a minute or less: a Charisma save or it rises as a Vampire
 * Spawn until dawn, once per dusk. The "Varies" record is built at the Rare tier.
 */
export default class SwordOfTheCrimsonAbbot extends WeaponProperties {

  // DDB carries Blood Drain only on the +2 and +3 records, and there as a "Restriction:" attack of an
  // untyped ("additional") 1d6, which this base does not build
  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] })],
        },
      },
    };
  }

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
