import logger from '../../logger.js';
import { copySupportedItemFlags } from "../import.js";
import { getMonsterCompendium } from "../importMonster.js";
import utils from "../../utils.js";
import DICTIONARY from "../../dictionary.js";
import { newVehicle } from './templates/vehicle.js';

async function parseVehicle(ddb) {

  let vehicle = duplicate(await newVehicle(ddb.name));
  let items = [];

  let img = ddb.largeAvatarUrl;
  // foundry doesn't support gifs
  if (img && img.match(/.gif$/)) {
    img = null;
  }
  vehicle.token.name = ddb.name;
  vehicle.flags.monsterMunch = {
    url: ddb.url,
    img: (img) ? img : ddb.avatarUrl,
    tokenImg: ddb.avatarUrl,
  };
  vehicle.flags.ddbimporter = {
    id: ddb.id,
    entityTypeId: ddb.entityTypeId,
    // creatureGroup: monster.creatureGroup ? monster.creatureGroup : null,
    creatureGroupId: ddb.creatureGroupId ? ddb.creatureGroupId : null,
    creatureFlags: ddb.creatureFlags ? ddb.creatureFlags : [],
    automatedEvcoationAnimation: ddb.automatedEvcoationAnimation ? ddb.automatedEvcoationAnimation : undefined,
    version: CONFIG.DDBI.version,
    isLegacy: ddb.isLegacy,
  };

  // const removedHitPoints = ddb.removedHitPoints ? ddb.removedHitPoints : 0;
  // const temporaryHitPoints = ddb.temporaryHitPoints ? ddb.removedHitPoints : 0;

  // // abilities
  // vehicle.data.abilities = getAbilities(vehicle.data.abilities, ddb);

  // // skills
  // vehicle.data.skills = (extra)
  //   ? getSkills(vehicle.data.skills, ddb)
  //   : getSkillsHTML(vehicle.data.skills, ddb);

  // // Senses
  // vehicle.data.attributes.senses = getSenses(ddb);
  // vehicle.token = await getTokenSenses(vehicle.token, ddb);

  // // Conditions
  // vehicle.data.traits.di = getDamageImmunities(ddb);
  // vehicle.data.traits.dr = getDamageResistances(ddb);
  // vehicle.data.traits.dv = getDamageVulnerabilities(ddb);
  // vehicle.data.traits.ci = getConditionImmunities(ddb);
  // const size = getSize(ddb);
  // vehicle.data.traits.size = size.value;
  // vehicle.token.width = size.token.value;
  // vehicle.token.height = size.token.value;
  // vehicle.token.scale = size.token.scale;


  // // languages
  // vehicle.data.traits.languages = getLanguages(ddb);

  // // attributes
  // vehicle.data.attributes.hp = getHitPoints(ddb, removedHitPoints, temporaryHitPoints);
  // const movement = getSpeed(ddb);
  // vehicle.data.attributes.movement = movement['movement'];

  // vehicle.data.attributes.prof = CONFIG.DDB.challengeRatings.find((cr) => cr.id == ddb.challengeRatingId).proficiencyBonus;

  // // ac
  // const ac = await generateAC(ddb, useItemAC);
  // vehicle.data.attributes.ac = ac.ac;
  // vehicle.flags.ddbimporter.flatAC = ac.flatAC;
  // items.push(...ac.ddbItems);

  // // details
  // const cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == ddb.challengeRatingId);
  // vehicle.data.details.type = getType(ddb);
  // const alignment = CONFIG.DDB.alignments.find((c) => ddb.alignmentId == c.id);
  // vehicle.data.details.alignment = alignment ? alignment.name : "";
  // vehicle.data.details.cr = cr.value;
  vehicle.data.details.source = utils.getSourceData(ddb);
  // vehicle.data.details.xp = {
  //   value: cr.xp
  // };
  // vehicle.data.details.environment = getEnvironments(ddb);
  // vehicle.data.details.biography.value = ddb.characteristicsDescription;

  // let actions, lairActions, legendaryActions, specialTraits, reactions, bonus, mythic;
  // let characterDescriptionAction, characterDescriptionReaction, unexpectedDescription;

  // [actions, characterDescriptionAction] = getActions(ddb);
  // items.push(...actions);

  // if (ddb.hasLair) {
  //   lairActions = getLairActions(ddb);
  //   items.push(...lairActions.lairActions);
  //   vehicle.data.resources["lair"] = lairActions.resource;
  // }

  // if (ddb.legendaryActionsDescription != "") {
  //   legendaryActions = getLegendaryActions(ddb, actions);
  //   items.push(...legendaryActions.legendaryActions);
  //   vehicle.data.resources["legact"] = legendaryActions.actions;
  //   vehicle.token.bar2 = {
  //     attribute: "resources.legact"
  //   };
  // }

  // if (ddb.specialTraitsDescription != "") {
  //   specialTraits = getSpecialTraits(ddb, actions);
  //   items.push(...specialTraits.specialActions);
  //   vehicle.data.resources["legres"] = specialTraits.resistance;
  // }

  // [reactions, characterDescriptionReaction] = getActions(ddb, "reaction");
  // items.push(...reactions);
  // [bonus, unexpectedDescription] = getActions(ddb, "bonus");
  // items.push(...bonus);
  // [mythic, unexpectedDescription] = getActions(ddb, "mythic");
  // items.push(...mythic);

  // if (unexpectedDescription) {
  //   logger.warn(`Unexpected description for ${ddb.name}`);
  // }
  // if (characterDescriptionAction) {
  //   vehicle.data.details.biography.value += characterDescriptionAction;
  // }
  // if (characterDescriptionReaction) {
  //   vehicle.data.details.biography.value += characterDescriptionReaction;
  // }
  // if (specialTraits?.characterDescription) {
  //   vehicle.data.details.biography.value += specialTraits.characterDescription;
  // }

  // // Spellcasting
  // const spellcastingData = getSpells(ddb);
  // vehicle.data.attributes.spellcasting = spellcastingData.spellcasting;
  // vehicle.data.attributes.spelldc = spellcastingData.spelldc;
  // vehicle.data.attributes.spellLevel = spellcastingData.spellLevel;
  // vehicle.data.details.spellLevel = spellcastingData.spellLevel;
  // vehicle.data.spells = spellcastingData.spells;
  // vehicle.flags.monsterMunch['spellList'] = spellcastingData.spellList;

  // const badItems = items.filter((i) => i.name === "" || !i.name);
  // if (badItems.length > 0) {
  //   logger.error(`${ddb.name} - ${badItems.length} items have no name.`, badItems);
  //   items = items.filter((i) => i.name && i.name !== "");
  // }

  // vehicle.items = items;

  // const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
  // if (legacyName) {
  //   if (ddb.isLegacy) {
  //     vehicle.name += " (Legacy)";
  //     vehicle.token.name += " (Legacy)";
  //   }
  // }

  // vehicle = await existingMonsterCheck(vehicle);

  // logger.debug("Importing Spells");
  // vehicle = await addSpells(vehicle);

  // vehicle = specialCases(vehicle);
  // if (game.settings.get("ddb-importer", "munching-policy-add-monster-effects")) {
  //   vehicle = await monsterFeatureEffectAdjustment(vehicle, ddb);
  // }

  return vehicle;
}
