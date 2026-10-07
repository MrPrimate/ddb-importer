import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Enlarge/Reduce. Two size categories, and its d4 rolls become d8. */
export default class RubyToadstool extends SpellComponentItem {

  override get spellName(): string {
    return "Enlarge/Reduce";
  }

}
