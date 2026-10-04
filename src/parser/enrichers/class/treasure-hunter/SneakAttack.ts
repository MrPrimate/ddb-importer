import RogueSneakAttack from "../rogue/SneakAttack";

/** Treasure Hunter calling: the rogue's Sneak Attack on this calling's own damage scale. */
export default class SneakAttack extends RogueSneakAttack {

  override get sneakAttackFormula(): string {
    return "@scale.treasure-hunter.sneak-attack";
  }

  override get useMidiSneakAttack(): boolean {
    return false;
  }

}
