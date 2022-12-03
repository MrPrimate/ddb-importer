/* eslint-disable require-atomic-updates */

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
import { monsterFeatureEffectAdjustment } from "../../effects/specialMonsters.js";

import logger from '../../logger.js';
import utils from "../../lib/utils.js";
import DICTIONARY from "../../dictionary.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";

/**
 *
 * @param {[string]} items Array of Strings or
 */
async function retrieveCompendiumItems(items, compendiumName) {
  const GET_ENTITY = true;

  const itemNames = items.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "name")) return item.name;
    return "";
  });

  const results = await CompendiumHelper.queryCompendiumEntries(compendiumName, itemNames, GET_ENTITY);
  const cleanResults = results.filter((item) => item !== null);

  return cleanResults;
}

/**
 *
 * @param {[items]} spells Array of Strings or items
 */
async function retrieveSpells(spells) {
  const compendiumName = await game.settings.get("ddb-importer", "entity-spell-compendium");
  const compendiumItems = await retrieveCompendiumItems(spells, compendiumName);
  const itemData = compendiumItems.map((i) => {
    let spell = i.toObject();
    delete spell._id;
    return spell;
  });

  return itemData;
}

function getSpellEdgeCase(spell, type, spellList) {
  const edgeCases = spellList.edgeCases;
  const edgeCase = edgeCases.find((edge) => edge.name.toLowerCase() === spell.name.toLowerCase() && edge.type === type);

  if (edgeCase) {
    logger.debug(`Spell edge case for ${spell.name}`);
    switch (edgeCase.edge.toLowerCase()) {
      case "self":
      case "self only":
        spell.system.target.type = "self";
        logger.debug("spell target changed to self");
        break;
      // no default
    }
    spell.name = `${spell.name} (${edgeCase.edge})`;
    spell.system.description.chat = `<p><b>Special Notes: ${edgeCase.edge}.</b></p>\n\n${spell.system.description.chat}`;
    spell.system.description.value = `<p><b>Special Notes: ${edgeCase.edge}.</b></p>\n\n${spell.system.description.value}`;

    const diceSearch = /(\d+)d(\d+)/;
    const diceMatch = edgeCase.edge.match(diceSearch);
    if (diceMatch) {
      if (spell.system.damage.parts[0] && spell.system.damage.parts[0][0]) {
        spell.system.damage.parts[0][0] = diceMatch[0];
      } else if (spell.system.damage.parts[0]) {
        spell.system.damage.parts[0] = [diceMatch[0]];
      } else {
        spell.system.damage.parts = [[diceMatch[0]]];
      }
    }

    // save DC 12
    const saveSearch = /save DC (\d+)/;
    const saveMatch = edgeCase.edge.match(saveSearch);
    if (saveMatch) {
      spell.system.save.dc = saveMatch[1];
      spell.system.save.scaling = "flat";
    }

  }

  // remove material components?
  if (!spellList.material) {
    spell.system.materials = {
      value: "",
      consumed: false,
      cost: 0,
      supply: 0
    };
    spell.system.components.material = false;
  }

}

async function addSpells(monster) {
  // check to see if we have munched flags to work on
  if (!monster.flags || !monster.flags.monsterMunch || !monster.flags.monsterMunch.spellList) {
    return monster;
  }

  const spellList = monster.flags.monsterMunch.spellList;
  logger.debug(`Spell List for edgecases`, spellList);
  const atWill = spellList.atwill;
  const klass = spellList.class;
  const innate = spellList.innate;
  const pact = spellList.pact;

  if (atWill.length !== 0) {
    logger.debug("Retrieving at Will spells:", atWill);
    let spells = await retrieveSpells(atWill);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      if (spell.system.level == 0) {
        spell.system.preparation = {
          mode: "prepared",
          prepared: false,
        };
      } else {
        spell.system.preparation = {
          mode: "atwill",
          prepared: false,
        };
        spell.system.uses = {
          value: null,
          max: null,
          per: "",
        };
      }
      getSpellEdgeCase(spell, "atwill", spellList);
      return spell;
    });
    // eslint-disable-next-line require-atomic-updates
    monster.items = monster.items.concat(spells);
  }

  // class spells
  if (klass.length !== 0) {
    logger.debug("Retrieving class spells:", klass);
    let spells = await retrieveSpells(klass);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      spell.system.preparation = {
        mode: "prepared",
        prepared: true,
      };
      getSpellEdgeCase(spell, "class", spellList);
      return spell;
    });
    // eslint-disable-next-line require-atomic-updates
    monster.items = monster.items.concat(spells);
  }

  // pact spells
  if (pact.length !== 0) {
    logger.debug("Retrieving pact spells:", pact);
    let spells = await retrieveSpells(pact);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      spell.system.preparation = {
        mode: "pact",
        prepared: true,
      };
      getSpellEdgeCase(spell, "pact", spellList);
      return spell;
    });
    // eslint-disable-next-line require-atomic-updates
    monster.items = monster.items.concat(spells);
  }

  // innate spells
  if (innate.length !== 0) {
    // innate:
    // {name: "", type: "srt/lng/day", value: 0}
    logger.debug("Retrieving innate spells:", innate);
    const spells = await retrieveSpells(innate);
    const innateSpells = spells.filter((spell) => spell !== null)
      .map((spell) => {
        const spellInfo = innate.find((w) => w.name.toLowerCase() == spell.name.toLowerCase());
        if (spellInfo) {
          const isAtWill = hasProperty(spellInfo, "innate") && !spellInfo.innate;
          if (spell.system.level == 0) {
            spell.system.preparation = {
              mode: "prepared",
              prepared: false,
            };
          } else {
            spell.system.preparation = {
              mode: isAtWill ? "atwill" : "innate",
              prepared: !isAtWill,
            };
          }
          if (isAtWill && spellInfo.type === "atwill") {
            spell.system.uses = {
              value: null,
              max: null,
              per: "",
            };
          } else {
            const perLookup = DICTIONARY.resets.find((d) => d.id == spellInfo.type);
            const per = spellInfo.type === "atwill"
              ? null
              : (perLookup && perLookup.type)
                ? perLookup.type
                : "day";
            spell.system.uses = {
              value: spellInfo.value,
              max: spellInfo.value,
              per: per,
            };
          }
          getSpellEdgeCase(spell, "innate", spellList);
        }
        return spell;
      });
    // eslint-disable-next-line require-atomic-updates
    monster.items = monster.items.concat(innateSpells);
  }
  return monster;
}

// eslint-disable-next-line complexity
async function parseMonster(monster, extra, useItemAC) {
  let foundryActor = duplicate(await newNPC(monster.name));
  let items = [];
  let img = (monster.basicAvatarUrl) ? monster.basicAvatarUrl : monster.largeAvatarUrl;
  // foundry doesn't support gifs
  if (img && img.match(/.gif$/)) {
    img = null;
  }

  foundryActor.prototypeToken.name = monster.name;
  foundryActor.flags.monsterMunch = {
    url: monster.url,
    img: (img) ? img : monster.avatarUrl,
    tokenImg: monster.avatarUrl,
  };
  foundryActor.flags.ddbimporter = {
    id: monster.id,
    entityTypeId: monster.entityTypeId,
    // creatureGroup: monster.creatureGroup ? monster.creatureGroup : null,
    creatureGroupId: monster.creatureGroupId ? monster.creatureGroupId : null,
    creatureFlags: monster.creatureFlags ? monster.creatureFlags : [],
    automatedEvcoationAnimation: monster.automatedEvcoationAnimation ? monster.automatedEvcoationAnimation : undefined,
    version: CONFIG.DDBI.version,
    isLegacy: monster.isLegacy,
  };

  const removedHitPoints = monster.removedHitPoints ? monster.removedHitPoints : 0;
  const temporaryHitPoints = monster.temporaryHitPoints ? monster.removedHitPoints : 0;

  // abilities
  foundryActor.system.abilities = getAbilities(foundryActor.system.abilities, monster);

  // skills
  foundryActor.system.skills = (extra)
    ? getSkills(foundryActor.system.skills, monster)
    : getSkillsHTML(foundryActor.system.skills, monster);

  // Senses
  foundryActor.system.attributes.senses = getSenses(monster);
  foundryActor.prototypeToken = await getTokenSenses(foundryActor.prototypeToken, monster);

  // Conditions
  foundryActor.system.traits.di = getDamageImmunities(monster);
  foundryActor.system.traits.dr = getDamageResistances(monster);
  foundryActor.system.traits.dv = getDamageVulnerabilities(monster);
  foundryActor.system.traits.ci = getConditionImmunities(monster);
  const size = getSize(monster);
  foundryActor.system.traits.size = size.value;
  foundryActor.prototypeToken.width = size.token.value;
  foundryActor.prototypeToken.height = size.token.value;
  foundryActor.prototypeToken.scale = size.token.scale;


  // languages
  foundryActor.system.traits.languages = getLanguages(monster);

  // attributes
  foundryActor.system.attributes.hp = getHitPoints(monster, removedHitPoints, temporaryHitPoints);
  const movement = getSpeed(monster);
  foundryActor.system.attributes.movement = movement['movement'];

  foundryActor.system.attributes.prof = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;

  // ac
  const ac = await generateAC(monster, useItemAC);
  foundryActor.system.attributes.ac = ac.ac;
  foundryActor.flags.ddbimporter.flatAC = ac.flatAC;
  items.push(...ac.ddbItems);

  // details
  const cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId);
  foundryActor.system.details.type = getType(monster);
  const alignment = CONFIG.DDB.alignments.find((c) => monster.alignmentId == c.id);
  foundryActor.system.details.alignment = alignment ? alignment.name : "";
  foundryActor.system.details.cr = cr.value;
  foundryActor.system.details.source = getSource(monster);
  foundryActor.system.details.xp = {
    value: cr.xp
  };
  foundryActor.system.details.environment = getEnvironments(monster);
  foundryActor.system.details.biography.value = monster.characteristicsDescription;

  let actions, lairActions, legendaryActions, specialTraits, reactions, bonus, mythic;
  let characterDescriptionAction, characterDescriptionReaction, unexpectedDescription;

  [actions, characterDescriptionAction] = getActions(monster);
  items.push(...actions);

  if (monster.hasLair) {
    lairActions = getLairActions(monster);
    items.push(...lairActions.lairActions);
    foundryActor.system.resources["lair"] = lairActions.resource;
  }

  if (monster.legendaryActionsDescription != "") {
    legendaryActions = getLegendaryActions(monster, actions);
    items.push(...legendaryActions.legendaryActions);
    foundryActor.system.resources["legact"] = legendaryActions.actions;
    foundryActor.prototypeToken.bar2 = {
      attribute: "resources.legact"
    };
  }

  if (monster.specialTraitsDescription != "") {
    specialTraits = getSpecialTraits(monster, actions);
    items.push(...specialTraits.specialActions);
    foundryActor.system.resources["legres"] = specialTraits.resistance;
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
    foundryActor.system.details.biography.value += characterDescriptionAction;
  }
  if (characterDescriptionReaction) {
    foundryActor.system.details.biography.value += characterDescriptionReaction;
  }
  if (specialTraits?.characterDescription) {
    foundryActor.system.details.biography.value += specialTraits.characterDescription;
  }

  // Spellcasting
  const spellcastingData = getSpells(monster);
  foundryActor.system.attributes.spellcasting = spellcastingData.spellcasting;
  foundryActor.system.attributes.spelldc = spellcastingData.spelldc;
  foundryActor.system.attributes.spellLevel = spellcastingData.spellLevel;
  foundryActor.system.details.spellLevel = spellcastingData.spellLevel;
  foundryActor.system.spells = spellcastingData.spells;
  foundryActor.flags.monsterMunch['spellList'] = spellcastingData.spellList;

  const badItems = items.filter((i) => i.name === "" || !i.name);
  if (badItems.length > 0) {
    logger.error(`${monster.name} - ${badItems.length} items have no name.`, badItems);
    items = items.filter((i) => i.name && i.name !== "");
  }

  foundryActor.items = items;

  const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
  if (legacyName) {
    if (monster.isLegacy) {
      foundryActor.name += " (Legacy)";
      foundryActor.prototypeToken.name += " (Legacy)";
    }
  }

  foundryActor = await CompendiumHelper.existingActorCheck("monster", foundryActor);

  logger.debug("Importing Spells");
  foundryActor = await addSpells(foundryActor);

  foundryActor = specialCases(foundryActor);
  if (game.settings.get("ddb-importer", "munching-policy-add-monster-effects")) {
    foundryActor = await monsterFeatureEffectAdjustment(foundryActor, monster);
  }

  // console.warn("Data:", monster);
  // console.warn("Monster:", duplicate(foundryActor));
  // logger.info(foundryActor.system.resources);
  // logger.info(foundryActor.system.traits.languages);

  // logger.info(foundryActor.system.attributes);
  return foundryActor;

}

export async function parseMonsters(monsterData, extra = false) {

  let foundryActors = [];
  let failedMonsterNames = [];

  const useItemAC = game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");

  monsterData.forEach((monster) => {
    try {
      logger.debug(`Attempting to parse ${monster.name}`);
      const foundryActor = parseMonster(monster, extra, useItemAC);
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
