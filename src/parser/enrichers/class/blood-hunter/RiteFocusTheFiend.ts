import _RiteFocus from "./_RiteFocus";

/**
 * While using the Rite of the Flame, reroll a 1 or 2 on the rite's extra damage
 * die and choose which roll to use.
 *
 * Not automated. midi's optional damage reroll (reroll-kh, as used by Savage
 * Attacker) rerolls the whole damage roll rather than only the dice that came
 * up 1 or 2, and it cannot be scoped to the rite's die alone, so wiring it up
 * would reroll more than the feature allows. Left passive, with the DDB action
 * suppressed so it does not attach a meaningless activity.
 */
export default class RiteFocusTheFiend extends _RiteFocus {

  get patronName(): string {
    return "The Fiend";
  }

  get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
