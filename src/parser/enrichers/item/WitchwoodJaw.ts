import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Animate Dead. The undead can speak and understand your languages. */
export default class WitchwoodJaw extends SpellComponentItem {

  override get spellName(): string {
    return "Animate Dead";
  }

}
