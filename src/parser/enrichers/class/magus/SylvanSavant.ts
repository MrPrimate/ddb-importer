import MagusCapstone from "./_MagusCapstone";

/** Sylvan Circle level 20: Emerald Spell Surge and Font Overflowing. */
export default class SylvanSavant extends MagusCapstone {

  override get restoreActionName(): string {
    return "Sylvan Savant: Font Overflowing";
  }

  override get restoredFeatureName(): string {
    return "Font of Life";
  }

  override get surgeSpells(): string[] {
    return ["Conjure Fey", "Wall of Thorns"];
  }

}
