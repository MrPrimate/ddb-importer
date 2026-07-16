import { DICTIONARY } from "../../config/_module";
import { utils } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

/**
 * Retrieves character abilities, including proficiency on saving throws
 */
DDBMonster.prototype._generateAbilities = function _generateAbilities(this: DDBMonster) {
  const cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId);
  const proficiencyBonus = cr.proficiencyBonus;

  this.abilities = foundry.utils.deepClone(this.npc.system.abilities) as I5eAbilities;
  DICTIONARY.actor.abilities.forEach((ability) => {
    const value = this.source.stats.find((stat) => stat.statId === ability.id).value || 0;
    const proficient = this.source.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;

    this.npc.system.abilities[ability.value]["value"] = value;
    this.npc.system.abilities[ability.value]["proficient"] = proficient;

    if (proficient) {
      // this.npc.system.abilities[ability.value]["prof"] = proficiencyBonus;
      const saveBonus = this.source.savingThrows.find((stat) => stat.statId === ability.id).bonusModifier || 0;
      if (saveBonus !== 0) {
        this.npc.system.abilities[ability.value].bonuses.save = String(saveBonus);
      }
    }

    // this.npc.system.abilities[ability.value]["dc"] = mod + proficiencyBonus + 8;

    this.abilities[ability.value] = foundry.utils.deepClone(this.npc.system.abilities[ability.value]) as any;
    // this.abilities[ability.value].mod = mod;
  });

  let initBonus = null;

  const dexMod = utils.calculateModifier(this.abilities.dex.value);
  if (foundry.utils.hasProperty(this.source, "initiativeBonus") && Number.isInteger(parseInt(String(this.source.initiativeBonus)))) {
    initBonus = parseInt(String(this.source.initiativeBonus)) - dexMod;
  } else if (foundry.utils.hasProperty(this.source, "extraInitiative") && Number.isInteger(parseInt(String(this.source.extraInitiative)))) {
    initBonus = parseInt(String(this.source.extraInitiative)) - dexMod;
  }

  if (initBonus !== null && Number.isInteger(parseInt(String(initBonus)))) {
    if ((initBonus / 2) === proficiencyBonus) {
      this.npc.system.attributes.init.bonus = "2 * @prof";
    } else if (initBonus === proficiencyBonus) {
      this.npc.system.attributes.init.bonus = "@prof";
    } else {
      this.npc.system.attributes.init.bonus = `${initBonus}`;
    }
  }

};
