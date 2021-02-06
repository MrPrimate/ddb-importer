
import { getTextSenses, getTokenSenses, getSenses } from "./senses.js";
import {
  getDamageImmunities,
  getDamageResistances,
  getDamageVulnerabilities,
  getConditionImmunities,
} from "./conditions.js";
import { getAbilities } from "./abilities.js";
import { getSkills } from "./skills.js";
import { getLanguages } from "./languages.js";
import { getHitPoints } from "./hp.js";
import { getSpeed } from "./movement.js";
import { getSize } from "./size.js";
import { getSource } from "./source.js";
import { getEnvironments } from "./environments.js";
import { getLairActions } from "./lair.js";
import { getLegendaryActions } from "./legendary.js";
import { getActions } from "./actions.js";
import { getSpecialTraits } from "./specialtraits.js";
import { getSpells } from "./spells.js";

import { DDB_CONFIG } from "../../ddb-config.js";
import { MONSTER_TEMPLATE } from "./templates/monster.js";

import logger from '../../logger.js';

export function parseMonsters(monsterData) {

  let foundryActors = [];
  let failedMonsterNames = [];

  const setVision = game.settings.get("ddb-importer", "monster-has-vision");

  monsterData.forEach((monster) => {
    try {
      let foundryActor = JSON.parse(JSON.stringify(MONSTER_TEMPLATE));
      // logger.info(monster);
      let items = [];

      // name
      foundryActor.name = monster.name;
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
      };

      const removedHitPoints = monster.removedHitPoints ? monster.removedHitPoints : 0;
      const temporaryHitPoints = monster.temporaryHitPoints ? monster.removedHitPoints : 0;

      // abilities
      foundryActor.data.abilities = getAbilities(foundryActor.data.abilities, monster, DDB_CONFIG);

      // skills
      foundryActor.data.skills = getSkills(foundryActor.data.skills, monster, DDB_CONFIG);

      // Senses
      foundryActor.data.attributes.senses = getSenses(monster, DDB_CONFIG);
      foundryActor.data.traits.senses = getTextSenses(monster);
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
      foundryActor.data.attributes.speed = movement['speed'];
      foundryActor.data.attributes.movement = movement['movement'];

      foundryActor.data.attributes.prof = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;

      // ac
      foundryActor.data.attributes.ac.value = monster.armorClass;

      // details
      const cr = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId);
      foundryActor.data.details.type = DDB_CONFIG.monsterTypes.find((c) => monster.typeId == c.id).name;
      foundryActor.data.details.alignment = DDB_CONFIG.alignments.find((c) => monster.alignmentId == c.id).name;
      foundryActor.data.details.cr = cr.value;
      foundryActor.data.details.source = getSource(monster, DDB_CONFIG);
      foundryActor.data.details.xp = {
        value: cr.xp
      };
      foundryActor.data.details.environment = getEnvironments(monster, DDB_CONFIG);
      foundryActor.data.details.biography.value = monster.characteristicsDescription;

      const actions = getActions(monster, DDB_CONFIG);
      items.push(...actions);

      if (monster.hasLair) {
        const lairActions = getLairActions(monster, DDB_CONFIG);
        items.push(...lairActions.lairActions);
        foundryActor.data.resources["lair"] = lairActions.resource;
      }

      if (monster.legendaryActionsDescription != "") {
        const legendaryActions = getLegendaryActions(monster, DDB_CONFIG, actions);
        items.push(...legendaryActions.legendaryActions);
        foundryActor.data.resources["legact"] = legendaryActions.actions;
        foundryActor.token.bar2 = {
          attribute: "resources.legact"
        };
      }

      if (monster.specialTraitsDescription != "") {
        const specialtraits = getSpecialTraits(monster, DDB_CONFIG, actions);
        items.push(...specialtraits.specialActions);
        foundryActor.data.resources["legres"] = specialtraits.resistance;
      }

      const reactions = getActions(monster, DDB_CONFIG, "reaction");
      items.push(...reactions);

      // Spellcasting
      const spellcastingData = getSpells(monster, DDB_CONFIG);
      foundryActor.data.attributes.spellcasting = spellcastingData.spellcasting;
      foundryActor.data.attributes.spelldc = spellcastingData.spelldc;
      foundryActor.data.attributes.spellLevel = spellcastingData.spellLevel;
      foundryActor.data.details.spellLevel = spellcastingData.spellLevel;
      foundryActor.data.spells = spellcastingData.spells;
      foundryActor.flags.monsterMunch['spellList'] = spellcastingData.spellList;

      foundryActor.items = items;

      // logger.info(JSON.stringify(foundryActor));
      // logger.info(foundryActor.data.resources);
      // logger.info(foundryActor.data.traits.languages);

      // logger.info(foundryActor.data.attributes);
      foundryActors.push(foundryActor);
    } catch (err) {
      logger.info(`Failed parsing ${monster.name}`);
      logger.info(err);
      logger.info(err.stack);
      failedMonsterNames.push(monster.name);
    }


  });
  const result = {
    actors: foundryActors,
    failedMonsterNames: failedMonsterNames,
  };

  return result;
}

