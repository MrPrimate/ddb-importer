import _BloodHunter from "./_BloodHunter";

/**
 * Shared behaviour for the Order of the Profane Soul's Rite Focus, 3rd level.
 *
 * The benefit depends on the patron chosen for Otherworldly Patron, and DDB
 * models that as an option on the single "Rite Focus" feature rather than as
 * nine features. Keeping the choice document (see KEEP_CHOICE_FEATURE) leaves
 * the name as "Rite Focus: <Patron>", which is what picks the enricher below.
 *
 * Every benefit only applies while a crimson rite is active on the weapon. That
 * is not detectable at parse time, so it is carried as activation condition
 * text rather than being gated automatically.
 *
 * The leading underscore keeps this out of the name lookup - pascalCase of a
 * DDB feature name can never start with one - while still being exported by
 * the generated barrel.
 */
export default class _RiteFocus extends _BloodHunter {

  /** Gate shared by every patron benefit. */
  static RITE_CONDITION = "While you have an active crimson rite";

  /** The on-hit trigger used by the patrons that key off damaging a creature. */
  static DAMAGE_CONDITION = "When you damage a creature with a weapon for which you have an active crimson rite";

  /** Patron name, e.g. "The Archfey". Overridden by each patron. */
  get patronName(): string {
    return "";
  }

  /**
   * DDB ships an action per patron spelled with a hyphen ("Rite Focus - The
   * Archfey"). Matching it means the activity binds to that action rather than
   * being dropped.
   */
  get activityName(): string {
    return `Rite Focus - ${this.patronName}`;
  }

  /** Hemocraft modifier as a roll formula, floored at 1 as the class text requires. */
  get hemocraftModifierMin1(): string {
    return `max(1, ${this.hemocraftModifier})`;
  }

}
