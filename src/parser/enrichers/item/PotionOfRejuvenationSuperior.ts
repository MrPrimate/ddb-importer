import _ManaPotion from "./_ManaPotion";

/** Potion of Rejuvenation (Superior): regains one expended spell slot of level 1 to 5 and heals 9d4 + 9. */
export default class PotionOfRejuvenationSuperior extends _ManaPotion {

  get maxSlotLevel(): number {
    return 5;
  }

  override get healingFormula(): string | null {
    return "9d4 + 9";
  }

}
