import logger from '../../logger.js';
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";

import { newVehicle } from './templates/vehicle.js';
import { getDamageImmunities, getConditionImmunities } from "./conditions.js";
import { getAbilities, getAbilityMods } from "./abilities.js";
import { getSize } from "./size.js";
import { getCapacity } from './capacity.js';
import { FLIGHT_IDS, getMovement } from './movement.js';
import { processComponents } from './components.js';
import { ACTION_THRESHOLDS } from './threshold.js';
import { parseTags } from '../../lib/DDBReferenceLinker.js';

// eslint-disable-next-line complexity
async function parseVehicle(ddb, extra = {}) {

  logger.debug("Parsing vehicle", { extra });
  let vehicle = foundry.utils.duplicate(await newVehicle(ddb.name));
  const configurations = {};
  ddb.configurations.forEach((c) => {
    configurations[c.key] = c.value;
  });

  let img = ddb.largeAvatarUrl;
  // foundry doesn't support gifs
  if (img && img.match(/.gif$/)) {
    img = null;
  }
  vehicle.prototypeToken.name = ddb.name;
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
  vehicle.system.abilities = getAbilities(vehicle.system.abilities, ddb);

  // Conditions
  vehicle.system.traits.di = getDamageImmunities(ddb);
  vehicle.system.traits.ci = getConditionImmunities(ddb);

  // size
  const size = getSize(ddb);
  vehicle.system.traits.size = size.value;
  vehicle.prototypeToken.width = size.token.value;
  vehicle.prototypeToken.height = size.token.value;
  vehicle.prototypeToken.scale = size.token.scale;

  vehicle.system.attributes.capacity = getCapacity(ddb);

  if (configurations.ST === "dimension") {
    vehicle.system.traits.dimensions = `(${ddb.length} ft. by ${ddb.width} ft.)`;
  }
  if (configurations.ST === "weight") {
    vehicle.system.traits.dimensions = `(${ddb.weight} lb.)`;
  }

  const movement = foundry.utils.duplicate(vehicle.system.attributes.movement);
  vehicle.system.attributes.movement = getMovement(ddb, configurations, movement);

  const primaryComponent = ddb.components.find((c) => c.isPrimaryComponent);
  // // ac
  // if we are using actor level HP apply
  if (!configurations.ECCR && primaryComponent) {
    vehicle.system.attributes.hp.value = primaryComponent.definition.hitPoints;
    vehicle.system.attributes.hp.max = primaryComponent.definition.hitPoints;
    if (!configurations.ECMT && Number.isInteger(primaryComponent.definition.mishapThreshold)) {
      vehicle.system.attributes.hp.mt = primaryComponent.definition.mishapThreshold;
    }
    if (!configurations.ECDT && Number.isInteger(primaryComponent.definition.damageThreshold)) {
      vehicle.system.attributes.hp.dt = primaryComponent.definition.damageThreshold;
    }
  }

  // if we are using actor level AC apply
  if (configurations.PCMT === "vehicle" && primaryComponent) {
    const mods = getAbilityMods(ddb);
    if (configurations.DT === "spelljammer") {
      vehicle.system.attributes.ac.motionless = primaryComponent.definition.armorClassDescription;
      vehicle.system.attributes.ac.flat = primaryComponent.definition.armorClass;
    } else {
      vehicle.system.attributes.ac.motionless = primaryComponent.definition.armorClass;
      vehicle.system.attributes.ac.flat = primaryComponent.definition.armorClass + mods["dex"];
    }
  }

  vehicle.system.vehicleType = FLIGHT_IDS.includes(ddb.id) || configurations.DT === "spelljammer"
    ? "air"
    : configurations.DT === "ship"
      ? "water"
      : "land";

  vehicle.items = processComponents(ddb, configurations);

  // No 5e support for vehicles yet:
  // fuel data

  // details
  vehicle.system.details.source = DDBHelper.parseSource(ddb);
  vehicle.system.details.biography.value = parseTags(ddb.description);

  if (configurations.EAS) {
    vehicle.system.attributes.actions.stations = true;
  }

  if (ddb.actionsText) {
    vehicle.system.details.biography.value += `<h2>Actions</h2>\n<p>${ddb.actionsText}</p>`;
    const componentActionSummaries = ddb.componentActionSummaries.map((feature) => {
      return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
    }).join('\n');
    vehicle.system.details.biography.value += `\n<p>${componentActionSummaries}</p>`;

    const actionsRegex = /On its turn(?:,*) the (?:.*?) can take (\d+) action/g;
    const actionsMatch = ddb.actionsText.match(actionsRegex);
    const numberOfActions = actionsMatch ? parseInt(actionsMatch[1]) : 1;

    vehicle.system.attributes.actions.value = numberOfActions;
    const actionThreshold = ACTION_THRESHOLDS.find((t) => t.id === ddb.id);
    vehicle.system.attributes.actions.thresholds = actionThreshold ? actionThreshold.thresholds : [];

  } else if (ddb.features.length > 0) {
    const featuresText = ddb.features.map((feature) => {
      return `<h3>${feature.name}</h3>\n<p>${feature.description}</p>`;
    }).join('\n');
    vehicle.system.details.biography.value += `<h2>Features</h2>\n<p>${featuresText}</p>`;
  }

  vehicle = await CompendiumHelper.existingActorCheck("vehicle", vehicle);

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
