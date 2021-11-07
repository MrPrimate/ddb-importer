import utils from "../../utils.js";
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

export default function getCharacter(ddb) {
  // *************************************
  // PARSING THE CHARACTER
  // **************************************
  //
  // ddb = fixCharacterLevels(ddb);
  let character = {
    data: JSON.parse(utils.getTemplate("character")),
    type: "character",
    effects: [],
    name: (ddb.character.name === "") ? "Hero With No Name" : ddb.character.name,
    // items: [],  // modified to check inventory analysis on update
    token: getToken(ddb),
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
          campaign: ddb.character.campaign,
        },
      },
    },
  };

    // proficiency
  // prettier-ignore
  character.data.attributes.prof = Math.ceil(1 + (0.25 * character.flags.ddbimporter.dndbeyond.totalLevels));

  // Get supported 5e feats and abilities
  // We do this first so we can check for them later
  character.flags.dnd5e = getSpecialTraits(ddb);

  // character abilities
  const abilityData = getAbilities(ddb);
  character.data.abilities = abilityData.base;
  character.flags.ddbimporter.dndbeyond.effectAbilities = abilityData.withEffects;
  character.flags.ddbimporter.dndbeyond.abilityOverrides = abilityData.overrides;

  // Hit Dice
  character.data.attributes.hd = getHitDice(ddb);

  // Death saves
  character.data.attributes.death = getDeathSaves(ddb);

  // exhaustion
  character.data.attributes.exhaustion = getExhaustion(ddb);

  // inspiration
  character.data.attributes.inspiration = ddb.character.inspiration;

  // armor class
  const autoAC = utils.versionCompare(game.data.system.data.version, "1.4.0") >= 0;
  const ac = getArmorClass(ddb, character);
  // D&D5e v1.4.0 AC features
  if (autoAC) {
    character.data.attributes.ac = ac.auto;
  } else {
    character.data.attributes.ac = ac.fixed;
  }
  character.flags.ddbimporter.acEffects = ac.effects;
  character.flags.ddbimporter.baseAC = ac.base;
  character.flags.ddbimporter.autoAC = ac.auto;
  character.flags.ddbimporter.overrideAC = ac.override;

  // hitpoints
  character.data.attributes.hp = getHitpoints(ddb, character);

  // initiative
  character.data.attributes.init = getInitiative(ddb, character);

  // speeds
  const movement = getSpeed(ddb);
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

  // known spells
  character.data.details.maxPreparedSpells = maxPreparedSpells(ddb, character);

  // xp
  character.data.details.xp.value = ddb.character.currentXp;

  // Character Traits/Ideal/Bond and Flaw
  character.data.details.trait = getTrait(ddb);
  character.data.details.ideal = getIdeal(ddb);
  character.data.details.bond = getBond(ddb);
  character.data.details.flaw = getFlaw(ddb);
  character.data.details.appearance = getAppearance(ddb);

  Object.assign(character.data.details, getDescription(ddb));

  character.data.details.alignment = getAlignment(ddb);

  // bio
  character.data.details.biography = getBiography(ddb);
  character.data.details.race = ddb.character.race.fullName;

  // traits
  character.data.traits.weaponProf = getWeaponProficiencies(ddb, character.flags.ddbimporter.dndbeyond.proficiencies);
  character.data.traits.armorProf = getArmorProficiencies(ddb, character.flags.ddbimporter.dndbeyond.proficiencies);
  character.data.traits.toolProf = getToolProficiencies(ddb, character.flags.ddbimporter.dndbeyond.proficiencies);
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
