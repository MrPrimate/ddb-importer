import SpellComponentItem from "./_SpellComponentItem";

/** The Magus Class: consumed when casting Revivify. Replaces the diamond; the target revives at its Hit Point maximum. */
export default class JadeToadstool extends SpellComponentItem {

  override get spellName(): string {
    return "Revivify";
  }

}
