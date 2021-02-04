import utils from "../../utils.js";
import { getArmorClass } from "./ac.js";
import { getSpecialTraits } from "./specialTraits.js";
import { getSkills } from "./skills.js";
import { getSpellCasting, getSpellDC, getSpellSlots } from "./spellCasting.js";
import { getHitpoints, getHitDice } from "./hp.js";
import { getSpeed } from "./speed.js";
import {
  getBackground,
  getTrait,
  getIdeal,
  getBond,
  getFlaw,
  getAlignment,
  getBiography,
  getAppearance,
} from "./bio.js";
import { getBonusAbilities, getBonusSpellAttacks, getBonusSpellDC, getBonusWeaponAttacks } from "./globalBonuses.js";
import {
  getProficiencies,
  getWeaponProficiencies,
  getArmorProficiencies,
  getToolProficiencies,
  getLanguages,
} from "./proficiencies.js";
import { getAbilities } from "./abilities.js";
import { getSenses, getSensesMap } from "./senses.js";
import { getToken } from "./token.js";
import {
  getDeathSaves,
  getExhaustion,
  getDamageImmunities,
  getDamageResistances,
  getDamageVulnerabilities,
  getConditionImmunities,
} from "./effects.js";
import { getResources } from "./resources.js";
import { getSize } from "./size.js";
import { getInitiative } from "./initiative.js";
import { getCurrency } from "./currency.js";

export default function getCharacter(ddb) {
  // *************************************
  // PARSING THE CHARACTER
  // **************************************
  //
  let character = {
    data: JSON.parse(utils.getTemplate("character")),
    type: "character",
    name: (ddb.character.name === "") ? "Hero With No Name" : ddb.character.name,
    // items: [],  // modified to check inventory analysis on update
    token: getToken(ddb),
    flags: {
      ddbimporter: {
        dndbeyond: {
          totalLevels: ddb.character.classes.reduce((prev, cur) => prev + cur.level, 0),
          proficiencies: getProficiencies(ddb),
          roUrl: ddb.character.readonlyUrl,
          characterValues: ddb.character.characterValues,
          templateStrings: [],
        },
      },
    },
  };

  // Get supported 5e feats and abilities
  // We do this first so we can check for them later
  character.flags.dnd5e = getSpecialTraits(ddb);

  // character abilities
  character.data.abilities = getAbilities(ddb);

  // Hit Dice
  character.data.attributes.hd = getHitDice(ddb);

  // Death saves
  character.data.attributes.death = getDeathSaves(ddb);

  // exhaustion
  character.data.attributes.exhaustion = getExhaustion(ddb);

  // inspiration
  character.data.attributes.inspiration = ddb.character.inspiration;

  // armor class
  character.data.attributes.ac = getArmorClass(ddb, character);

  // hitpoints
  character.data.attributes.hp = getHitpoints(ddb, character);

  // initiative
  character.data.attributes.init = getInitiative(ddb, character);

  // proficiency
  // prettier-ignore
  character.data.attributes.prof = Math.ceil(1 + (0.25 * character.flags.ddbimporter.dndbeyond.totalLevels));

  // speeds
  const movement = getSpeed(ddb);
  character.data.attributes.speed = movement['speed'];
  character.data.attributes.movement = movement['movement'];
  character.data.attributes.senses = getSensesMap(ddb);

  // spellcasting
  character.data.attributes.spellcasting = getSpellCasting(ddb, character);

  // spelldc
  character.data.attributes.spelldc = getSpellDC(ddb, character);

  // resources
  character.data.resources = getResources(ddb, character);

  // details
  character.data.details.background = getBackground(ddb);

  // xp
  character.data.details.xp.value = ddb.character.currentXp;

  // Character Traits/Ideal/Bond and Flaw
  character.data.details.trait = getTrait(ddb);
  character.data.details.ideal = getIdeal(ddb);
  character.data.details.bond = getBond(ddb);
  character.data.details.flaw = getFlaw(ddb);
  character.data.details.appearance = getAppearance(ddb);

  character.data.details.alignment = getAlignment(ddb);

  // bio
  character.data.details.biography = getBiography(ddb);
  character.data.details.race = ddb.character.race.fullName;

  // traits
  character.data.traits.weaponProf = getWeaponProficiencies(ddb, character);
  character.data.traits.armorProf = getArmorProficiencies(ddb, character);
  character.data.traits.toolProf = getToolProficiencies(ddb, character);
  character.data.traits.size = getSize(ddb);
  character.data.traits.senses = getSenses(ddb);
  character.data.traits.languages = getLanguages(ddb);
  character.data.traits.di = getDamageImmunities(ddb);
  character.data.traits.dr = getDamageResistances(ddb);
  character.data.traits.dv = getDamageVulnerabilities(ddb);
  character.data.traits.ci = getConditionImmunities(ddb);

  character.data.currency = getCurrency(ddb);
  character.data.skills = getSkills(ddb, character);
  character.data.spells = getSpellSlots(ddb);

  // Extra global bonuses
  // Extra bonuses
  character.data.bonuses.abilities = getBonusAbilities(ddb, character);
  // spell attacks
  character.data.bonuses.rsak = getBonusSpellAttacks(ddb, character, "ranged");
  character.data.bonuses.msak = getBonusSpellAttacks(ddb, character, "melee");
  // spell dc
  character.data.bonuses.spell = getBonusSpellDC(ddb, character);
  // melee weapon attacks
  character.data.bonuses.mwak = getBonusWeaponAttacks(ddb, character, "melee");
  // ranged weapon attacks
  // e.g. ranged fighting style
  character.data.bonuses.rwak = getBonusWeaponAttacks(ddb, character, "ranged");

  return character;
}
