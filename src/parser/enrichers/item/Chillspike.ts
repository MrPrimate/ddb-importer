import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Chillspike: an extra 1d10 cold on a hit, and Everglacier's Fury - a Magic action raising spikes
 * under up to three targets within 20 feet, a Dexterity save or 2d8 cold (nothing on a success).
 */
export default class Chillspike extends WeaponProperties {

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, types: ["cold"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Everglacier's Fury", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "16" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["cold"] })],
        activationType: "action",
        condition: "Plunge the pike into the ground: up to three different targets on the ground",
        targetCount: "3",
        range: { value: "20", units: "ft" },
        noeffect: true,
      }),
    ];
  }

}
