import utils from "../../lib/utils.js";
import { getArmorClass } from "./ac.js";
import { getSpecialTraits } from "./specialTraits.js";
import { getSkills } from "./skills.js";
import { getSpellCasting, getSpellDC, getSpellSlots, maxPreparedSpells } from "./spellCasting.js";
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
  getDescription,
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
// import { fixCharacterLevels } from "./filterModifiers.js";

async function newPC(ddb) {
  const name = (ddb.character.name === "") ? "Hero With No Name" : ddb.character.name;

  let character = {
    system: JSON.parse(utils.getTemplate("character")),
    type: "character",
    effects: [],
    name: name,
    // items: [],  // modified to check inventory analysis on update
    flags: {
      ddbimporter: {
        compendium: false,
        acEffects: [],
        baseAC: 10,
        dndbeyond: {
          totalLevels: ddb.character.classes.reduce((prev, cur) => prev + cur.level, 0),
          proficiencies: getProficiencies(ddb),
          proficienciesIncludingEffects: getProficiencies(ddb, true),
          roUrl: ddb.character.readonlyUrl,
          characterValues: ddb.character.characterValues,
          templateStrings: [],
        },
      },
    },
  };

  character.prototypeToken = getToken(ddb);

  return character;
};


export default async function generateCharacter(ddb) {
  // *************************************
  // PARSING THE CHARACTER
  // **************************************
  //
  // ddb = fixCharacterLevels(ddb);

  let character = await newPC(ddb);

  const flags = {
    ddbimporter: {
      compendium: false,
      acEffects: [],
      baseAC: 10,
      dndbeyond: {
        totalLevels: ddb.character.classes.reduce((prev, cur) => prev + cur.level, 0),
        proficiencies: getProficiencies(ddb),
        proficienciesIncludingEffects: getProficiencies(ddb, true),
        roUrl: ddb.character.readonlyUrl,
        characterValues: ddb.character.characterValues,
        templateStrings: [],
        campaign: ddb.character.campaign,
      },
    },
  };
  setProperty(character, "flags", flags);

  // proficiency
  // prettier-ignore
  character.system.attributes.prof = Math.ceil(1 + (0.25 * character.flags.ddbimporter.dndbeyond.totalLevels));

  // Get supported 5e feats and abilities
  // We do this first so we can check for them later
  character.flags.dnd5e = getSpecialTraits(ddb);

  // character abilities
  const abilityData = getAbilities(ddb);
  character.system.abilities = abilityData.base;
  character.flags.ddbimporter.dndbeyond.effectAbilities = abilityData.withEffects;
  character.flags.ddbimporter.dndbeyond.abilityOverrides = abilityData.overrides;

  // Hit Dice
  character.system.attributes.hd = getHitDice(ddb);

  // Death saves
  character.system.attributes.death = getDeathSaves(ddb);

  // exhaustion
  character.system.attributes.exhaustion = getExhaustion(ddb);

  // inspiration
  character.system.attributes.inspiration = ddb.character.inspiration;

  // armor class
  const ac = getArmorClass(ddb, character);
  character.system.attributes.ac = ac.auto;
  character.flags.ddbimporter.acEffects = ac.effects;
  character.effects = character.effects.concat(ac.bonusEffects);
  character.flags.ddbimporter.baseAC = ac.base;
  character.flags.ddbimporter.autoAC = ac.auto;
  character.flags.ddbimporter.overrideAC = ac.override;

  // hitpoints
  character.system.attributes.hp = getHitpoints(ddb, character);

  // initiative
  character.system.attributes.init = getInitiative(ddb, character);

  // speeds
  const movement = getSpeed(ddb);
  character.system.attributes.movement = movement['movement'];
  character.system.attributes.senses = getSensesMap(ddb);

  // spellcasting
  character.system.attributes.spellcasting = getSpellCasting(ddb, character);

  // spelldc
  character.system.attributes.spelldc = getSpellDC(ddb, character);

  // resources
  character.system.resources = getResources(ddb, character);

  // details
  character.system.details.background = getBackground(ddb);

  // known spells
  character.system.details.maxPreparedSpells = maxPreparedSpells(ddb, character);

  // xp
  character.system.details.xp.value = ddb.character.currentXp;

  // Character Traits/Ideal/Bond and Flaw
  character.system.details.trait = getTrait(ddb);
  character.system.details.ideal = getIdeal(ddb);
  character.system.details.bond = getBond(ddb);
  character.system.details.flaw = getFlaw(ddb);
  character.system.details.appearance = getAppearance(ddb);

  Object.assign(character.system.details, getDescription(ddb));

  character.system.details.alignment = getAlignment(ddb);

  // bio
  character.system.details.biography = getBiography(ddb);
  character.system.details.race = ddb.character.race.fullName;

  // traits
  character.system.traits.weaponProf = getWeaponProficiencies(ddb, character.flags.ddbimporter.dndbeyond.proficiencies);
  character.system.traits.armorProf = getArmorProficiencies(ddb, character.flags.ddbimporter.dndbeyond.proficiencies);
  character.system.traits.toolProf = getToolProficiencies(ddb, character.flags.ddbimporter.dndbeyond.proficiencies);
  character.system.traits.size = getSize(ddb);
  character.system.traits.senses = getSenses(ddb);
  character.system.traits.languages = getLanguages(ddb);
  character.system.traits.di = getDamageImmunities(ddb);
  character.system.traits.dr = getDamageResistances(ddb);
  character.system.traits.dv = getDamageVulnerabilities(ddb);
  character.system.traits.ci = getConditionImmunities(ddb);

  character.system.currency = getCurrency(ddb);
  character.system.skills = await getSkills(ddb, character);
  character.system.spells = getSpellSlots(ddb);

  // Extra global bonuses
  // Extra bonuses
  character.system.bonuses.abilities = getBonusAbilities(ddb, character);
  // spell attacks
  character.system.bonuses.rsak = getBonusSpellAttacks(ddb, character, "ranged");
  character.system.bonuses.msak = getBonusSpellAttacks(ddb, character, "melee");
  // spell dc
  character.system.bonuses.spell = getBonusSpellDC(ddb, character);
  // melee weapon attacks
  character.system.bonuses.mwak = getBonusWeaponAttacks(ddb, character, "melee");
  // ranged weapon attacks
  // e.g. ranged fighting style
  character.system.bonuses.rwak = getBonusWeaponAttacks(ddb, character, "ranged");

  return character;
}
