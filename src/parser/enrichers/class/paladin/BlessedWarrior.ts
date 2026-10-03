import FightingStyleCantrips from "../shared/_FightingStyleCantrips";

export default class BlessedWarrior extends FightingStyleCantrips {

  get featName(): string {
    return "Blessed Warrior";
  }

  get className(): string {
    return "Paladin";
  }

  get spellList(): string {
    return "class:cleric";
  }

  get spellAbility(): string {
    return "cha";
  }

}
