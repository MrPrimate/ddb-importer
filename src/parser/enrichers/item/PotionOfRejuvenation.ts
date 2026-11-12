import _ManaPotion from "./_ManaPotion";

/** Potion of Rejuvenation: regains one expended spell slot of level 1 and heals 3d4 + 3. */
export default class PotionOfRejuvenation extends _ManaPotion {

  get maxSlotLevel(): number {
    return 1;
  }

  override get healingFormula(): string | null {
    return "3d4 + 3";
  }

}
