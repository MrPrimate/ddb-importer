import MagusCapstone from "./_MagusCapstone";

/** Shadow Court level 20: Jade Spell Surge and Shadow Puppeteer. */
export default class EnshadowedSifu extends MagusCapstone {

  override get restoreActionName(): string {
    return "Enshadowed Sifu: Shadow Puppeteer";
  }

  override get restoredFeatureName(): string {
    return "False Body Jutsu";
  }

  override get surgeSpells(): string[] {
    return ["Eyebite", "Programmed Illusion"];
  }

}
