import MagusCapstone from "./_MagusCapstone";

/** Arcane Order level 20: Amethyst Spell Surge and Vexing Vortices. */
export default class MasterOfTheArcane extends MagusCapstone {

  override get restoreActionName(): string {
    return "Master of the Arcane: Vexing Vortices";
  }

  override get restoredFeatureName(): string {
    return "Arcane Vortex";
  }

  override get surgeSpells(): string[] {
    return ["Chain Lightning", "Contingency"];
  }

}
