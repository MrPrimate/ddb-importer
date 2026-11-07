import Generic from "../Generic";

/**
 * Demon Hunter (World of Warcraft: the Ranger option and the WoW Demon Hunter): the soul fragment pool
 * is Wis mod (minimum one) per Long Rest, plus one at level 13 and another at 17. DDB resolves the
 * count for the character's level only, so the maximum is a formula on the levels. The options
 * (Double Jump, Soul Cleave, Disrupt, Warglaive Mastery) come from DDB's actions.
 */
export default class SoulFragments extends Generic {

  override get override(): IDDBOverrideData {
    const levels = `@classes.${this.classIdentifier("Ranger")}.levels`;
    return {
      uses: {
        max: `max(1, @abilities.wis.mod) + min(2, floor(max(0, ${levels} - 9) / 4))`,
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
