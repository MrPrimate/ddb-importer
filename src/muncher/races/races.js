import logger from "../../logger.js";
import utils from "../../utils.js";
import { getCompendiumLabel, updateCompendium, srdFiddling, getImagePath } from "../import.js";
import { munchNote } from "../utils.js";

const FEATURE_DUP = [
  "Breath Weapon",
];

const RACE_TEMPLATE = {
  "name": "",
  "type": "feat",
  "data": {
    "description": {
      "value": "",
      "chat": "",
      "unidentified": ""
    },
    "source": "",
  },
  "sort": 2600000,
  "flags": {
    "ddbimporter": {},
  },
  "img": null
};

function buildBase(data) {
  let result = JSON.parse(JSON.stringify(RACE_TEMPLATE));

  result.name = (data.fullName) ? data.fullName : data.name;
  result.data.description.value += `${data.description}\n\n`;

  result.flags.ddbimporter = {
    entityRaceId: data.entityRaceId,
  };

  if (data.moreDetailsUrl) {
    result.flags.ddbimporter['moreDetailsUrl'] = data.moreDetailsUrl;
  }

  result.data.source = utils.parseSource(data);

  if (data.isSubRace && data.baseRaceName) result.data.requirements = data.baseRaceName;

  return result;
}


async function buildRace(race, compendiumRacialTraits, compendiumLabel) {
  let result = buildBase(race);

  let avatarUrl;
  let largeAvatarUrl;
  let portraitAvatarUrl;

  if (race.portraitAvatarUrl) {
    portraitAvatarUrl = await getImagePath(race.portraitAvatarUrl, "race-portrait", race.fullName);
    result.img = portraitAvatarUrl;
    result.flags.ddbimporter['portraitAvatarUrl'] = race.portraitAvatarUrl;
  }

  if (race.avatarUrl) {
    avatarUrl = await getImagePath(race.avatarUrl, "race-avatar", race.fullName);
    result.flags.ddbimporter['avatarUrl'] = race.avatarUrl;
    if (!result.img) {
      result.img = avatarUrl;
    }
  }

  if (race.largeAvatarUrl) {
    largeAvatarUrl = await getImagePath(race.largeAvatarUrl, "race-large", race.fullName);
    // eslint-disable-next-line require-atomic-updates
    result.flags.ddbimporter['largeAvatarUrl'] = race.largeAvatarUrl;
    if (!result.img) {
      // eslint-disable-next-line require-atomic-updates
      result.img = largeAvatarUrl;
    }
  }

  const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
  // eslint-disable-next-line require-atomic-updates
  result.data.description.value += image;

  race.racialTraits.forEach((f) => {
    const feature = f.definition;
    const featureMatch = compendiumRacialTraits.find((match) => feature.name === match.name && match.flags.ddbimporter && match.flags.ddbimporter.entityRaceId === feature.entityRaceId);
    const title = (featureMatch) ? `<p><b>${feature.name}</b> @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</p>` : `<p><b>${feature.name}</b></p>`;
    result.data.description.value += `${title}\n${feature.description}\n\n`;
  });

  return result;
}

async function getRacialTraitsLookup(racialTraits) {
  const compendiumLabel = getCompendiumLabel("traits");
  const compendium = await game.packs.get(compendiumLabel);
  const index = await compendium.getIndex({ fields: ["name", "flags.ddbimporter.entityRaceId"] });
  const traitIndex = await index.filter((i) => racialTraits.some((orig) => i.name === orig.name));
  return traitIndex;
}

export async function getDDBRace(ddb) {
  const compendiumLabel = getCompendiumLabel("traits");
  const compendiumRacialTraits = await getRacialTraitsLookup(ddb.character.race.racialTraits.map((r) => r.definition));
  const builtRace = await buildRace(ddb.character.race, compendiumRacialTraits, compendiumLabel);
  delete builtRace.sort;
  return builtRace;
}

function getRacialTrait(trait, fullName) {
  logger.debug("Race trait build started");

  let result = buildBase(trait);

  const duplicateFeature = FEATURE_DUP.includes(result.name);
  result.name = (duplicateFeature) ? `${result.name} (${fullName})` : result.name;

  result.flags.ddbimporter['spellListIds'] = trait.spellListIds;
  result.flags.ddbimporter['definitionKey'] = trait.definitionKey;
  result.flags.ddbimporter['race'] = fullName;
  result.data.requirements = fullName;

  return result;
}

const NO_TRAITS = [
  "Speed",
  "Ability Score Increase",
  "Size",
  "Feat",
  "Languages",
];

export async function getRaces(data) {
  logger.debug("get races started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let results = [];
  let races = [];
  let racialFeatures = [];

  data.forEach((race) => {
    logger.debug(`${race.fullName} features parsing started...`);
    race.racialTraits.forEach((trait) => {
      logger.debug(`${trait.definition.name} trait starting...`);
      if (!trait.definition.hideInSheet && !NO_TRAITS.includes(trait.definition.name)) {
        const parsedTrait = getRacialTrait(trait.definition, race.fullName);
        racialFeatures.push(parsedTrait);
        results.push({ race: race.fullName, trait: trait.definition.name });
      }
    });
  });

  const fiddledRacialFeatures = await srdFiddling(racialFeatures, "traits");
  munchNote(`Importing ${fiddledRacialFeatures.length} traits!`, true);
  await updateCompendium("traits", { traits: fiddledRacialFeatures }, updateBool);

  const compendiumLabel = getCompendiumLabel("traits");
  const compendiumRacialTraits = await getRacialTraitsLookup(fiddledRacialFeatures);

  await Promise.allSettled(data.map(async (race) => {
    logger.debug(`${race.fullName} race parsing started...`);
    const builtRace = await buildRace(race, compendiumRacialTraits, compendiumLabel);
    races.push(builtRace);
  }));

  const fiddledRaces = await srdFiddling(races, "races");
  munchNote(`Importing ${fiddledRaces.length} races!`, true);

  await updateCompendium("races", { races: fiddledRaces }, updateBool);

  return results;
}
