import { DICTIONARY } from "../../config/_module";
import DDBMonster from "../DDBMonster";

/**
 * Retrieves character abilities, including proficiency on saving throws
 */
DDBMonster.prototype._generateAbilities = function _generateAbilities() {
  // go through every ability
  const cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId);
  const proficiencyBonus = cr.proficiencyBonus;

  this.abilities = foundry.utils.deepClone(this.npc.system.abilities);
  DICTIONARY.actor.abilities.forEach((ability) => {
    const value = this.source.stats.find((stat) => stat.statId === ability.id).value || 0;
    const proficient = this.source.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

    this.npc.system.abilities[ability.value]["value"] = value;
    this.npc.system.abilities[ability.value]["proficient"] = proficient;

    if (proficient) {
      this.npc.system.abilities[ability.value]["prof"] = proficiencyBonus;
      const saveBonus = this.source.savingThrows.find((stat) => stat.statId === ability.id).bonusModifier || 0;
      if (saveBonus !== 0) {
        this.npc.system.abilities[ability.value].bonuses.save = saveBonus;
      }
    }

    this.npc.system.abilities[ability.value]["dc"] = mod + proficiencyBonus + 8;

    this.abilities[ability.value] = foundry.utils.deepClone(this.npc.system.abilities[ability.value]);
    this.abilities[ability.value].mod = mod;
  });

  let initBonus = null;

  if (foundry.utils.hasProperty(this.source, "initiativeBonus") && Number.isInteger(parseInt(this.source.initiativeBonus))) {
    initBonus = parseInt(this.source.initiativeBonus) - this.abilities.dex.mod;
  } else if (foundry.utils.hasProperty(this.source, "extraInitiative") && Number.isInteger(parseInt(this.source.extraInitiative))) {
    initBonus = parseInt(this.source.extraInitiative) - this.abilities.dex.mod;
  }

  if (initBonus !== null && Number.isInteger(parseInt(initBonus))) {
    if ((initBonus / 2) === proficiencyBonus) {
      this.npc.system.attributes.init.bonus = "2 * @prof";
    } else if (initBonus === proficiencyBonus) {
      this.npc.system.attributes.init.bonus = "@prof";
    } else {
      this.npc.system.attributes.init.bonus = `${initBonus}`;
    }
  }

};
