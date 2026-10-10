import MagusCapstone from "./_MagusCapstone";

/** Knights Stygian level 20: Obsidian Spell Surge and Stygian Sentinel. */
export default class DarkestKnight extends MagusCapstone {

  override get restoreActionName(): string {
    return "Darkest Knight: Stygian Sentinel";
  }

  override get restoredFeatureName(): string {
    return "Open the Iron Gates";
  }

  override get surgeSpells(): string[] {
    return ["Circle of Death", "Create Undead"];
  }

}
