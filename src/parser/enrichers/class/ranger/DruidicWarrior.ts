import FightingStyleCantrips from "../shared/_FightingStyleCantrips";

export default class DruidicWarrior extends FightingStyleCantrips {

  get featName(): string {
    return "Druidic Warrior";
  }

  get className(): string {
    return "Ranger";
  }

  get spellList(): string {
    return "class:druid";
  }

  // the text says Wisdom; the official PHB item's advancement says Charisma
  get spellAbility(): string {
    return "wis";
  }

}
