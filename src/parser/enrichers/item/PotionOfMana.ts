import _ManaPotion from "./_ManaPotion";

/** Potion of Mana: regains one expended spell slot of level 1. */
export default class PotionOfMana extends _ManaPotion {

  get maxSlotLevel(): number {
    return 1;
  }

}
