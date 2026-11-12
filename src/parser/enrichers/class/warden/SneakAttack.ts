import RogueSneakAttack from "../rogue/SneakAttack";

/** Warden (Forayer) Ambusher: the rogue's Sneak Attack on this calling's own damage scale. */
export default class SneakAttack extends RogueSneakAttack {

  override get sneakAttackFormula(): string {
    return `@scale.${this.subclassIdentifier("Forayer")}.ambusher`;
  }

  override get cunningStrikeLevel(): number | null {
    return null;
  }

  override get useMidiSneakAttack(): boolean {
    return false;
  }

}
