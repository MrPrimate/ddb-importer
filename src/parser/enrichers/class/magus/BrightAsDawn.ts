import MagusCapstone from "./_MagusCapstone";

/** Heaven's Guard level 20: Alabaster Spell Surge and Celestial Shieldbearer. */
export default class BrightAsDawn extends MagusCapstone {

  override get restoreActionName(): string {
    return "Bright as Dawn: Celestial Shieldbearer";
  }

  override get restoredFeatureName(): string {
    return "Cloak of Radiance";
  }

  override get surgeSpells(): string[] {
    return ["Heal", "Sunbeam"];
  }

}
