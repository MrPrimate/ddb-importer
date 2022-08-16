import logger from '../../logger.js';
import utils from "../../utils.js";

import { existingActorCheck } from "../utils.js";
import { newVehicle } from './templates/vehicle.js';
import { getDamageImmunities, getConditionImmunities } from "./conditions.js";
import { getAbilities, getAbilityMods } from "./abilities.js";
import { getSize } from "./size.js";
import { getCapacity } from './capacity.js';
import { FLIGHT_IDS, getMovement } from './movement.js';
import { processComponents } from './components.js';
import { ACTION_THRESHOLDS } from './threshold.js';
import { parseTags } from '../../parser/templateStrings.js';

// eslint-disable-next-line complexity
async function parseVehicle(ddb, extra = {}) {

  logger.debug("Parsing vehicle", { extra });
  let vehicle = duplicate(await newVehicle(ddb.name));
  const configurations = {};
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

  vehicle.data.attributes.capacity = getCapacity(ddb);

  if (configurations.ST === "dimension") {
    vehicle.data.traits.dimensions = `(${ddb.length} ft. by ${ddb.width} ft.)`;
  }
  if (configurations.ST === "weight") {
    vehicle.data.traits.dimensions = `(${ddb.weight} lb.)`;
  }

  const movement = duplicate(vehicle.data.attributes.movement);
  vehicle.data.attributes.movement = getMovement(ddb, configurations, movement);

  const primaryComponent = ddb.components.find((c) => c.isPrimaryComponent);
  // // ac
  // if we are using actor level HP apply
  if (configurations.ECCR && primaryComponent) {
    vehicle.data.attributes.hp.value = primaryComponent.definition.hitPoints;
    vehicle.data.attributes.hp.max = primaryComponent.definition.hitPoints;
    if (!configurations.ECMT && Number.isInteger(primaryComponent.definition.mishapThreshold)) {
      vehicle.data.attributes.hp.mt = primaryComponent.definition.mishapThreshold;
    }
    if (!configurations.ECDT && Number.isInteger(primaryComponent.definition.damageThreshold)) {
      vehicle.data.attributes.hp.dt = primaryComponent.definition.damageThreshold;
    }
  }

  // if we are using actor level AC apply
  if (configurations.PCMT === "vehicle" && primaryComponent) {
    const mods = getAbilityMods(ddb);
    if (configurations.DT === "spelljammer") {
      vehicle.data.attributes.ac.motionless = primaryComponent.definition.armorClassDescription;
      vehicle.data.attributes.ac.flat = primaryComponent.definition.armorClass;
    } else {
      vehicle.data.attributes.ac.motionless = primaryComponent.definition.armorClass;
      vehicle.data.attributes.ac.flat = primaryComponent.definition.armorClass + mods["dex"];
    }
  }

  vehicle.data.vehicleType = FLIGHT_IDS.includes(ddb.id) || configurations.DT === "spelljammer"
    ? "air"
    : configurations.DT === "ship"
      ? "water"
      : "land";

  vehicle.items = processComponents(ddb, configurations);

  // No 5e support for vehicles yet:
  // fuel data

  // details
  vehicle.data.details.source = utils.parseSource(ddb);
  vehicle.data.details.biography.value = parseTags(ddb.description);

  if (configurations.EAS) {
    vehicle.data.attributes.actions.stations = true;
  }

  if (ddb.actionsText) {
    vehicle.data.details.biography.value += `<h2>Actions</h2>\n<p>${ddb.actionsText}</p>`;
    const componentActionSummaries = ddb.componentActionSummaries.map((feature) => {
      return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
    }).join('\n');
    vehicle.data.details.biography.value += `\n<p>${componentActionSummaries}</p>`;

    const actionsRegex = /On its turn(?:,*) the (?:.*?) can take (\d+) action/g;
    const actionsMatch = ddb.actionsText.match(actionsRegex);
    const numberOfActions = actionsMatch ? parseInt(actionsMatch[1]) : 1;

    vehicle.data.attributes.actions.value = numberOfActions;
    const actionThreshold = ACTION_THRESHOLDS.find((t) => t.id === ddb.id);
    vehicle.data.attributes.actions.thresholds = actionThreshold ? actionThreshold.thresholds : [];

  } else if (ddb.features.length > 0) {
    const featuresText = ddb.features.map((feature) => {
      return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
    }).join('\n');
    vehicle.data.details.biography.value += `<h2>Features</h2>\n<p>${featuresText}</p>`;
  }

  vehicle = await existingActorCheck("vehicle", vehicle);

  return vehicle;
}


export async function parseVehicles(ddbData, extra = false) {

  let foundryActors = [];
  let failedVehicleNames = [];

  ddbData.forEach((vehicle) => {
    try {
      logger.debug(`Attempting to parse ${vehicle.name}`);
      const foundryActor = parseVehicle(vehicle, extra);
      foundryActors.push(foundryActor);
    } catch (err) {
      logger.error(`Failed parsing ${vehicle.name}`);
      logger.error(err);
      logger.error(err.stack);
      failedVehicleNames.push(vehicle.name);
    }
  });

  const result = {
    actors: await Promise.all(foundryActors),
    failedVehicleNames,
  };

  return result;
}
