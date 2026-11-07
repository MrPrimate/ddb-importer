import _ManaPotion from "./_ManaPotion";

/** Potion of Mana (Greater): regains one expended spell slot of level 1 to 3. */
export default class PotionOfManaGreater extends _ManaPotion {

  get maxSlotLevel(): number {
    return 3;
  }

}
