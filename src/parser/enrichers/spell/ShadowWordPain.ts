import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Priest): the save deals 1d10 + the spellcasting modifier Psychic and curses the
 * target, which then takes 1d10 Psychic at the start of each of its turns until it saves at the end
 * of one. DDB lists the tick as a second part of the save and drops the modifier.
 */
export default class ShadowWordPain extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 10,
              bonus: "@mod",
              types: ["psychic"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({ name: "Start of Turn Damage", parts: [1], condition: "At the start of each of the cursed target's turns" }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shadow Word: Pain: Cursed",
        options: {
          description: "You take 1d10 Psychic damage at the start of each of your turns, and repeat the save at the end of each of your turns, ending the curse on a success.",
        },
      },
    ];
  }

}
