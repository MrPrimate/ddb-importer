
import { getTokenSenses, getSenses } from "./senses.js";
import {
  getDamageImmunities,
  getDamageResistances,
  getDamageVulnerabilities,
  getConditionImmunities,
} from "./conditions.js";
import { getAbilities } from "./abilities.js";
import { getSkills, getSkillsHTML } from "./skills.js";
import { getLanguages } from "./languages.js";
import { getHitPoints } from "./hp.js";
import { getSpeed } from "./movement.js";
import { getSize } from "./size.js";
import { getSource } from "./source.js";
import { getEnvironments } from "./environments.js";
import { getLairActions } from "./features/lair.js";
import { getLegendaryActions } from "./features/legendary.js";
import { getActions } from "./features/actions.js";
import { getSpecialTraits } from "./features/specialtraits.js";
import { getSpells } from "./spells.js";
import { getType } from "./type.js";
import { generateAC } from "./ac.js";

import { DDB_CONFIG } from "../../ddbConfig.js";
import { newNPC } from "./templates/monster.js";
import { specialCases } from "./special.js";

import logger from '../../logger.js';

async function parseMonster(monster, setVision, extra, useItemAC) {
  let foundryActor = JSON.parse(JSON.stringify(newNPC(monster.name)));
  // logger.info(monster);
  let items = [];

  // name
  // foundryActor.name = monster.name;
  // logger.info("********************");
  // logger.info(monster.name);
  let img = (monster.basicAvatarUrl) ? monster.basicAvatarUrl : monster.largeAvatarUrl;
  // foundry doesn't support gifs
  if (img && img.match(/.gif$/)) {
    img = null;
  }
  foundryActor.token.name = monster.name;
  foundryActor.flags.monsterMunch = {
    url: monster.url,
    img: (img) ? img : monster.avatarUrl,
    tokenImg: monster.avatarUrl,
  };
  foundryActor.flags.ddbimporter = {
    id: monster.id,
    entityTypeId: monster.entityTypeId,
    creatureGroup: monster.creatureGroup ? monster.creatureGroup : null,
    creatureFlags: monster.creatureFlags ? monster.creatureFlags : [],
    automatedEvcoationAnimation: monster.automatedEvcoationAnimation ? monster.automatedEvcoationAnimation : undefined,
    version: CONFIG.DDBI.version,
  };

  const removedHitPoints = monster.removedHitPoints ? monster.removedHitPoints : 0;
  const temporaryHitPoints = monster.temporaryHitPoints ? monster.removedHitPoints : 0;

  // abilities
  foundryActor.data.abilities = getAbilities(foundryActor.data.abilities, monster, DDB_CONFIG);

  // skills
  foundryActor.data.skills = (extra)
    ? getSkills(foundryActor.data.skills, monster, DDB_CONFIG)
    : getSkillsHTML(foundryActor.data.skills, monster, DDB_CONFIG);

  // Senses
  foundryActor.data.attributes.senses = getSenses(monster, DDB_CONFIG);
  foundryActor.token = getTokenSenses(foundryActor.token, monster, DDB_CONFIG);
  foundryActor.token.vision = setVision;

  // Conditions
  foundryActor.data.traits.di = getDamageImmunities(monster, DDB_CONFIG);
  foundryActor.data.traits.dr = getDamageResistances(monster, DDB_CONFIG);
  foundryActor.data.traits.dv = getDamageVulnerabilities(monster, DDB_CONFIG);
  foundryActor.data.traits.ci = getConditionImmunities(monster, DDB_CONFIG);
  const size = getSize(monster, DDB_CONFIG);
  foundryActor.data.traits.size = size.value;
  foundryActor.token.width = size.token.value;
  foundryActor.token.height = size.token.value;
  foundryActor.token.scale = size.token.scale;


  // languages
  foundryActor.data.traits.languages = getLanguages(monster, DDB_CONFIG);

  // attributes
  foundryActor.data.attributes.hp = getHitPoints(monster, removedHitPoints, temporaryHitPoints);
  const movement = getSpeed(monster, DDB_CONFIG);
  foundryActor.data.attributes.movement = movement['movement'];

  foundryActor.data.attributes.prof = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;

  // ac
  const ac = await generateAC(monster, DDB_CONFIG, useItemAC);
  foundryActor.data.attributes.ac = ac.ac;
  foundryActor.flags.ddbimporter.flatAC = ac.flatAC;
  items.push(...ac.ddbItems);

  // details
  const cr = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId);
  foundryActor.data.details.type = getType(monster, DDB_CONFIG);
  const alignment = DDB_CONFIG.alignments.find((c) => monster.alignmentId == c.id);
  foundryActor.data.details.alignment = alignment ? alignment.name : "";
  foundryActor.data.details.cr = cr.value;
  foundryActor.data.details.source = getSource(monster, DDB_CONFIG);
  foundryActor.data.details.xp = {
    value: cr.xp
  };
  foundryActor.data.details.environment = getEnvironments(monster, DDB_CONFIG);
  foundryActor.data.details.biography.value = monster.characteristicsDescription;

  let actions, lairActions, legendaryActions, specialTraits, reactions, bonus, mythic;
  let characterDescriptionAction, characterDescriptionReaction, unexpectedDescription;

  [actions, characterDescriptionAction] = getActions(monster, DDB_CONFIG);
  items.push(...actions);

  if (monster.hasLair) {
    lairActions = getLairActions(monster, DDB_CONFIG);
    items.push(...lairActions.lairActions);
    foundryActor.data.resources["lair"] = lairActions.resource;
  }

  if (monster.legendaryActionsDescription != "") {
    legendaryActions = getLegendaryActions(monster, DDB_CONFIG, actions);
    items.push(...legendaryActions.legendaryActions);
    foundryActor.data.resources["legact"] = legendaryActions.actions;
    foundryActor.token.bar2 = {
      attribute: "resources.legact"
    };
  }

  if (monster.specialTraitsDescription != "") {
    specialTraits = getSpecialTraits(monster, DDB_CONFIG, actions);
    items.push(...specialTraits.specialActions);
    foundryActor.data.resources["legres"] = specialTraits.resistance;
  }

  [reactions, characterDescriptionReaction] = getActions(monster, DDB_CONFIG, "reaction");
  items.push(...reactions);
  [bonus, unexpectedDescription] = getActions(monster, DDB_CONFIG, "bonus");
  items.push(...bonus);
  [mythic, unexpectedDescription] = getActions(monster, DDB_CONFIG, "mythic");
  items.push(...mythic);

  if (unexpectedDescription) {
    logger.warn(`Unexpected description for ${monster.name}`);
  }
  if (characterDescriptionAction) {
    foundryActor.data.details.biography.value += characterDescriptionAction;
  }
  if (characterDescriptionReaction) {
    foundryActor.data.details.biography.value += characterDescriptionReaction;
  }
  if (specialTraits?.characterDescription) {
    foundryActor.data.details.biography.value += specialTraits.characterDescription;
  }

  // Spellcasting
  const spellcastingData = getSpells(monster, DDB_CONFIG);
  foundryActor.data.attributes.spellcasting = spellcastingData.spellcasting;
  foundryActor.data.attributes.spelldc = spellcastingData.spelldc;
  foundryActor.data.attributes.spellLevel = spellcastingData.spellLevel;
  foundryActor.data.details.spellLevel = spellcastingData.spellLevel;
  foundryActor.data.spells = spellcastingData.spells;
  foundryActor.flags.monsterMunch['spellList'] = spellcastingData.spellList;

  const badItems = items.filter((i) => i.name === "" || !i.name);
  if (badItems.length > 0) {
    logger.error(`${monster.name} - ${badItems.length} items have no name.`, badItems);
    items = items.filter((i) => i.name && i.name !== "");
  }

  foundryActor.items = items;

  foundryActor = specialCases(foundryActor);
  // logger.warn("Monster:", JSON.parse(JSON.stringify(foundryActor)));
  // console.warn("Data:", monster);
  // console.warn("Monster:", JSON.parse(JSON.stringify(foundryActor)));
  // logger.info(foundryActor.data.resources);
  // logger.info(foundryActor.data.traits.languages);

  // logger.info(foundryActor.data.attributes);
  return foundryActor;

}

export async function parseMonsters(monsterData, extra = false) {

  let foundryActors = [];
  let failedMonsterNames = [];

  const setVision = game.settings.get("ddb-importer", "monster-has-vision");
  const useItemAC = game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");

  monsterData.forEach((monster) => {
    try {
      const foundryActor = parseMonster(monster, setVision, extra, useItemAC);
      foundryActors.push(foundryActor);
    } catch (err) {
      logger.error(`Failed parsing ${monster.name}`);
      logger.error(err);
      logger.error(err.stack);
      failedMonsterNames.push(monster.name);
    }


  });

  const result = {
    actors: await Promise.all(foundryActors),
    failedMonsterNames: failedMonsterNames,
  };

  return result;
}

