import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Death Knight): the 2d6 Necrotic save curses on a failure; an attack roll that
 * damages a cursed target adds 1d6 Necrotic, which DDB lists as a second part of the save.
 */
export default class DeathAndDecay extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({ name: "Cursed: Extra Damage", parts: [1], condition: "You damage a cursed target with an attack roll" }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Death and Decay: Cursed",
        options: {
          expiry: "sourceEnd",
          description: "An attack roll that damages you deals an extra 1d6 Necrotic damage.",
        },
      },
    ];
  }

}
