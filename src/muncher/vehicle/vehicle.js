import logger from '../../logger.js';
import utils from "../../utils.js";
import DICTIONARY from "../../dictionary.js";
import { existingActorCheck } from "../utils.js";

import { newVehicle } from './templates/vehicle.js';

import {
  getDamageImmunities,
  getDamageResistances,
  getDamageVulnerabilities,
  getConditionImmunities,
} from "./conditions.js";
import { getAbilities } from "./abilities.js";
// import { getSkills, getSkillsHTML } from "./skills.js";
// import { getLanguages } from "./languages.js";
// import { getHitPoints } from "./hp.js";
// import { getSpeed } from "./movement.js";
import { getSize } from "./size.js";
// import { getSource } from "./source.js";
// import { getEnvironments } from "./environments.js";
// import { getLairActions } from "./features/lair.js";
// import { getLegendaryActions } from "./features/legendary.js";
// import { getActions } from "./features/actions.js";
// import { getSpecialTraits } from "./features/specialtraits.js";
// import { getSpells } from "./spells.js";
// import { getType } from "./type.js";
// import { generateAC } from "./ac.js";
// import { specialCases } from "./special.js";
// import { monsterFeatureEffectAdjustment } from "../../effects/specialMonsters.js";


async function parseVehicle(ddb, extra = {}) {

  let vehicle = duplicate(await newVehicle(ddb.name));
  let items = [];
  let configurations = {};
  ddb.configurations.forEach((c) => {
    configurations[c.key] = c.value;
  });

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
    version: CONFIG.DDBI.version,
    configurations,
  };

  // const removedHitPoints = ddb.removedHitPoints ? ddb.removedHitPoints : 0;
  // const temporaryHitPoints = ddb.temporaryHitPoints ? ddb.removedHitPoints : 0;

  // abilities
  vehicle.data.abilities = getAbilities(vehicle.data.abilities, ddb);

  // Conditions
  vehicle.data.traits.di = getDamageImmunities(ddb);
  vehicle.data.traits.ci = getConditionImmunities(ddb);

  // size
  const size = getSize(ddb);
  vehicle.data.traits.size = size.value;
  vehicle.token.width = size.token.value;
  vehicle.token.height = size.token.value;
  vehicle.token.scale = size.token.scale;

  // TODO: this varies depending on the vehicle type
  // // attributes
  // vehicle.data.attributes.hp = getHitPoints(ddb, removedHitPoints, temporaryHitPoints);
  // const movement = getSpeed(ddb);
  // vehicle.data.attributes.movement = movement['movement'];

  // // ac
  // const ac = await generateAC(ddb, useItemAC);
  // vehicle.data.attributes.ac = ac.ac;
  // vehicle.flags.ddbimporter.flatAC = ac.flatAC;
  // items.push(...ac.ddbItems);

  // TODO:

  // levels
  // thresholds damage
  // thresholds mishaps
  // capacity people
  // capacity cargo
  // weight
  // travel pace
  // vehicle type
  // fuel data
  // components
  // dimensions


  // details
  vehicle.data.details.source = utils.getSourceData(ddb);
  vehicle.data.details.biography.value = ddb.description;

  if (ddb.actionsText) {
    vehicle.data.details.biography.value += `<h2>Actions</h2>\n<p>${ddb.actionsText}</p>`;
    const componentActionSummaries = ddb.componentActionSummaries.map((feature) => {
      return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
    }).join('\n')
    vehicle.data.details.biography.value += `\n<p>${componentActionSummaries}</p>`;
  } else if (ddb.features.length > 0) {
    const featuresText = ddb.features.map((feature) => {
      return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
    }).join('\n');
    vehicle.data.details.biography.value += `<h2>Features</h2>\n<p>${featuresText}</p>`;
  }

  vehicle.items = items;


  vehicle = await existingActorCheck("vehicle", vehicle);


  return vehicle;
}
