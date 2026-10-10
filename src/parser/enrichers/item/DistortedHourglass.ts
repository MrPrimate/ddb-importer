import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Haste or Slow. Both spells take effect, on one Concentration. */
export default class DistortedHourglass extends SpellComponentItem {

  override get spellName(): string {
    return "Haste or Slow";
  }

}
