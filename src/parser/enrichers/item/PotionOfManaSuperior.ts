import _ManaPotion from "./_ManaPotion";

/** Potion of Mana (Superior): regains one expended spell slot of level 1 to 5. */
export default class PotionOfManaSuperior extends _ManaPotion {

  get maxSlotLevel(): number {
    return 5;
  }

}
