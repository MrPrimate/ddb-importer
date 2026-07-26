import { DICTIONARY } from "../../config/_module";
import { logger, utils } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

/**
 * Retrieves character abilities, including proficiency on saving throws
 */
DDBMonster.prototype._generateAbilities = function _generateAbilities(this: DDBMonster) {
  const cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId);
  if (!cr) {
    logger.warn(`Unknown challenge rating id ${this.source.challengeRatingId} for ${this.source.name}, defaulting proficiency bonus to 2`);
  }
  const proficiencyBonus = cr?.proficiencyBonus ?? 2;

  const npcAbilities = this.npc.system.abilities;
  const init = this.npc.system.attributes?.init;
  if (!npcAbilities || !init) {
    logger.warn(`_generateAbilities: missing npc abilities or init attribute for ${this.source.name}`);
    return;
  }

  this.abilities = foundry.utils.deepClone(npcAbilities);
  DICTIONARY.actor.abilities.forEach((ability) => {
    const value = this.source.stats.find((stat) => stat.statId === ability.id)?.value || 0;
    const proficient = this.source.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;

    const npcAbility = npcAbilities[ability.value];
    npcAbility["value"] = value;
    npcAbility["proficient"] = proficient;

    if (proficient) {
      // npcAbility["prof"] = proficiencyBonus;
      const saveBonus = this.source.savingThrows.find((stat) => stat.statId === ability.id)?.bonusModifier || 0;
      if (saveBonus !== 0) {
        npcAbility.bonuses ??= {};
        npcAbility.bonuses.save = String(saveBonus);
      }
    }

    // npcAbility["dc"] = mod + proficiencyBonus + 8;

    this.abilities[ability.value] = foundry.utils.deepClone(npcAbility);
    // this.abilities[ability.value].mod = mod;
  });

  let initBonus = null;

  const dexMod = utils.calculateModifier(this.abilities.dex.value ?? 10);
  if (foundry.utils.hasProperty(this.source, "initiativeBonus") && Number.isInteger(parseInt(String(this.source.initiativeBonus)))) {
    initBonus = parseInt(String(this.source.initiativeBonus)) - dexMod;
  } else if (foundry.utils.hasProperty(this.source, "extraInitiative") && Number.isInteger(parseInt(String(this.source.extraInitiative)))) {
    initBonus = parseInt(String(this.source.extraInitiative)) - dexMod;
  }

  if (initBonus !== null && Number.isInteger(parseInt(String(initBonus)))) {
    if ((initBonus / 2) === proficiencyBonus) {
      init.bonus = "2 * @prof";
    } else if (initBonus === proficiencyBonus) {
      init.bonus = "@prof";
    } else {
      init.bonus = `${initBonus}`;
    }
  }

};
