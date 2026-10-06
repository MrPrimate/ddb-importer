import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty, weaponRange } from "./_ItemActivities";

/**
 * Lightning Khopesh: its extra 1d6 lightning on a hit is DDB's modifier, on the attack. The first
 * time on each of your turns you miss with an attack roll made with advantage, stray sparks still
 * deal 1d6 lightning to the target, which is a damage activity of its own.
 */
export default class LightningKhopesh extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Stray Sparks", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["lightning"] })],
        condition: "The first time on each of your turns you miss with an attack roll made with advantage using this weapon",
        range: weaponRange(this),
        noeffect: true,
      }),
    ];
  }

}
