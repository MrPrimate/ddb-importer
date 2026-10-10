import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Forced Hesitation. A failed save lowers Initiative by the two highest damage dice. */
export default class IronFeather extends SpellComponentItem {

  override get spellName(): string {
    return "Forced Hesitation";
  }

}
