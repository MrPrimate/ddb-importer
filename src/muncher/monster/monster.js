
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
  foundryActor.data.abilities = getAbilities(foundryActor.data.abilities, monster);

  // skills
  foundryActor.data.skills = (extra)
    ? getSkills(foundryActor.data.skills, monster)
    : getSkillsHTML(foundryActor.data.skills, monster);

  // Senses
  foundryActor.data.attributes.senses = getSenses(monster);
  foundryActor.token = getTokenSenses(foundryActor.token, monster);
  foundryActor.token.vision = setVision;

  // Conditions
  foundryActor.data.traits.di = getDamageImmunities(monster);
  foundryActor.data.traits.dr = getDamageResistances(monster);
  foundryActor.data.traits.dv = getDamageVulnerabilities(monster);
  foundryActor.data.traits.ci = getConditionImmunities(monster);
  const size = getSize(monster);
  foundryActor.data.traits.size = size.value;
  foundryActor.token.width = size.token.value;
  foundryActor.token.height = size.token.value;
  foundryActor.token.scale = size.token.scale;


  // languages
  foundryActor.data.traits.languages = getLanguages(monster);

  // attributes
  foundryActor.data.attributes.hp = getHitPoints(monster, removedHitPoints, temporaryHitPoints);
  const movement = getSpeed(monster);
  foundryActor.data.attributes.movement = movement['movement'];

  foundryActor.data.attributes.prof = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;

  // ac
  const ac = await generateAC(monster, useItemAC);
  foundryActor.data.attributes.ac = ac.ac;
  foundryActor.flags.ddbimporter.flatAC = ac.flatAC;
  items.push(...ac.ddbItems);

  // details
  const cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId);
  foundryActor.data.details.type = getType(monster);
  const alignment = CONFIG.DDB.alignments.find((c) => monster.alignmentId == c.id);
  foundryActor.data.details.alignment = alignment ? alignment.name : "";
  foundryActor.data.details.cr = cr.value;
  foundryActor.data.details.source = getSource(monster);
  foundryActor.data.details.xp = {
    value: cr.xp
  };
  foundryActor.data.details.environment = getEnvironments(monster);
  foundryActor.data.details.biography.value = monster.characteristicsDescription;

  let actions, lairActions, legendaryActions, specialTraits, reactions, bonus, mythic;
  let characterDescriptionAction, characterDescriptionReaction, unexpectedDescription;

  [actions, characterDescriptionAction] = getActions(monster);
  items.push(...actions);

  if (monster.hasLair) {
    lairActions = getLairActions(monster);
    items.push(...lairActions.lairActions);
    foundryActor.data.resources["lair"] = lairActions.resource;
  }

  if (monster.legendaryActionsDescription != "") {
    legendaryActions = getLegendaryActions(monster, actions);
    items.push(...legendaryActions.legendaryActions);
    foundryActor.data.resources["legact"] = legendaryActions.actions;
    foundryActor.token.bar2 = {
      attribute: "resources.legact"
    };
  }

  if (monster.specialTraitsDescription != "") {
    specialTraits = getSpecialTraits(monster, actions);
    items.push(...specialTraits.specialActions);
    foundryActor.data.resources["legres"] = specialTraits.resistance;
  }

  [reactions, characterDescriptionReaction] = getActions(monster, "reaction");
  items.push(...reactions);
  [bonus, unexpectedDescription] = getActions(monster, "bonus");
  items.push(...bonus);
  [mythic, unexpectedDescription] = getActions(monster, "mythic");
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
  const spellcastingData = getSpells(monster);
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

  const setVision = game.settings.get("ddb-importer", "munching-policy-monster-use-vision");
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

