import _ManaPotion from "./_ManaPotion";

/** Potion of Rejuvenation (Greater): regains one expended spell slot of level 1 to 3 and heals 6d4 + 6. */
export default class PotionOfRejuvenationGreater extends _ManaPotion {

  get maxSlotLevel(): number {
    return 3;
  }

  override get healingFormula(): string | null {
    return "6d4 + 6";
  }

}
