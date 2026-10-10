import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Magic Weapon. The spell lasts 8 hours. */
export default class TinyMithrilHammer extends SpellComponentItem {

  override get spellName(): string {
    return "Magic Weapon";
  }

}
