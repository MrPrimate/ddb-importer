import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Reaper's Scream: invoking the death rune (a bonus action, once per dawn) stuns each creature of
 * your choice within 60 feet on a failed Wisdom save until the start of your next turn. A natural
 * 20 grants 10 temporary hit points, and while they last melee attackers take 10 necrotic.
 */
export default class ReapersScream extends WeaponProperties {

  static SCREAM = "Invoke the Rune";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const temp = itemProperty("Reaper's Harvest", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
      condition: "You roll a 20 on an attack roll with this weapon; a creature that hits you in melee while you have them takes 10 necrotic",
      selfTarget: true,
      noeffect: true,
    });
    return [
      itemProperty(ReapersScream.SCREAM, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], formula: "15" },
        activationType: "bonus",
        condition: "Each creature of your choice within 60 feet",
        template: { type: "radius", size: "60" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dawn" },
      }),
      {
        ...temp,
        build: {
          ...temp.build,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ bonus: "10", types: ["temphp"] }),
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{ name: "Reaper's Scream", activityMatch: ReapersScream.SCREAM, statuses: ["Stunned"], options: { transfer: false, expiry: "sourceStart", durationSeconds: 6, durationRounds: 1 } }];
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
