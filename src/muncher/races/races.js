import logger from "../../logger.js";
import { parseTags } from "../../parser/templateStrings.js";
import utils from "../../utils.js";
import { updateCompendium, srdFiddling, getImagePath } from "../import.js";
import { munchNote, getCompendiumType, getCompendiumLabel } from "../utils.js";

const FEATURE_DUP = [
  "Breath Weapon",
  "Natural Armor",
  "Darkvision",
  "Flight",
  "Hunter's Lore",
  "Claws",
  "Beak",
  "Spells of the Mark",
  "Shifting Feature",
  "Creature Type",
  "Aggressive",
  "Amphibious",
  "Ancestral Legacy",
  "Bite",
  "Cantrip",
  "Celestial Resistance",
  "Charge",
  "Child of the Sea",
  "Draconic Resistance",
  "Fey Ancestry",
  "Hold Breath",
  "Hooves",
  "Horns",
  "Magic Resistance",
  "Mental Discipline",
  "Natural Athlete",
  "Powerful Build",
  "Sunlight Sensitivity",
  "Superior Darkvision",
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
    "obsidian": {
      "source": {
        "type": "race"
      }
    },
  },
  "img": null
};

function buildBase(data) {
  let result = duplicate(RACE_TEMPLATE);

  result.name = (data.fullName) ? data.fullName.replace("’", "'") : data.name.replace("’", "'");
  result.system.description.value += `${data.description}\n\n`;

  result.flags.ddbimporter = {
    entityRaceId: data.entityRaceId,
    version: CONFIG.DDBI.version,
    sourceId: data.sources.length > 0 ? [0].sourceId : -1, // is homebrew
    baseName: (data.fullName) ? data.fullName.replace("’", "'") : data.name.replace("’", "'")
  };

  if (data.moreDetailsUrl) {
    result.flags.ddbimporter['moreDetailsUrl'] = data.moreDetailsUrl;
  }

  result.system.source = utils.parseSource(data);

  if (data.isSubRace && data.baseRaceName) result.system.requirements = data.baseRaceName;
  const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
  if (legacyName && data.isLegacy) {
    result.name += " (Legacy)";
  }

  return result;
}


async function buildRace(race, compendiumRacialTraits) {
  let result = buildBase(race);

  let avatarUrl;
  let largeAvatarUrl;
  let portraitAvatarUrl;

  result.flags.ddbimporter.baseRaceId = race.baseRaceId;
  result.flags.ddbimporter.baseName = race.baseName;
  result.flags.ddbimporter.baseRaceName = race.baseRaceName;
  result.flags.ddbimporter.fullName = race.fullName;
  result.flags.ddbimporter.subRaceShortName = race.subRaceShortName;
  result.flags.ddbimporter.isHomebrew = race.isHomebrew;
  result.flags.ddbimporter.isLegacy = race.isLegacy;
  result.flags.ddbimporter.isSubRace = race.isSubRace;
  result.flags.ddbimporter.moreDetailsUrl = race.moreDetailsUrl;
  result.flags.ddbimporter.featIds = race.featIds;

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
      result.img = largeAvatarUrl;
    }
  }

  const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
  result.system.description.value += image;

  const compendiumLabel = getCompendiumLabel("traits");

  race.racialTraits.forEach((f) => {
    const feature = f.definition;
    const featureMatch = compendiumRacialTraits.find((match) =>
      hasProperty(match, "flags.ddbimporter.baseName") && hasProperty(match, "flags.ddbimporter.entityRaceId") &&
      feature.name.replace("’", "'") === match.flags.ddbimporter.baseName &&
      match.flags.ddbimporter.entityRaceId === feature.entityRaceId
    );
    const title = (featureMatch) ? `<p><b>@Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</b></p>` : `<p><b>${feature.name}</b></p>`;
    result.system.description.value += `${title}\n${feature.description}\n\n`;
  });

  result.system.description.value = parseTags(result.system.description.value);

  return result;
}

async function getRacialTraitsLookup(racialTraits, fail = true) {
  const compendium = getCompendiumType("traits", fail);
  if (compendium) {
    const flags = ["name", "flags.ddbimporter.entityRaceId", "flags.ddbimporter.baseName"];
    const index = await compendium.getIndex({ fields: flags });
    const traitIndex = await index.filter((i) => racialTraits.some((orig) => i.name === orig.name));
    return traitIndex;
  } else {
    return [];
  }
}

export async function getDDBRace(ddb) {
  const compendiumRacialTraits = await getRacialTraitsLookup(ddb.character.race.racialTraits.map((r) => r.definition), false);
  const builtRace = await buildRace(ddb.character.race, compendiumRacialTraits);
  delete builtRace.sort;
  return builtRace;
}

function getRacialTrait(trait, fullName, isLegacy) {
  logger.debug("Race trait build started");

  let result = buildBase(trait);

  const duplicateFeature = FEATURE_DUP.includes(result.name.replace("’", "'"));
  result.name = (duplicateFeature) ? `${result.name} (${fullName})` : result.name;

  const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
  if (legacyName && isLegacy) {
    // result.name += " (Legacy)";
    logger.debug(`Trait name ${result.name} is legacy`);
  }


  result.flags.ddbimporter['spellListIds'] = trait.spellListIds;
  result.flags.ddbimporter['definitionKey'] = trait.definitionKey;
  result.flags.ddbimporter['race'] = fullName;
  result.system.requirements = fullName;

  result.data.description.value = parseTags(result.data.description.value);

  return result;
}

const NO_TRAITS = [
  "Speed",
  "Ability Score Increase",
  "Ability Score Increases",
  "Size",
  "Feat",
  "Languages",
  "Extra Language",
  "Age",
  "Alignment",
];

export async function getRaces(data) {
  logger.debug("get races started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let results = [];
  let races = [];
  let racialFeatures = [];

  // const legacyRaces =
  // setProperty(CONFIG, "DDBI.MUNCHER.RACES.LEGACY", duplicateRaces);

  const excludeLegacy = game.settings.get("ddb-importer", "munching-policy-exclude-legacy");
  data
    .filter((race) => !excludeLegacy || (excludeLegacy && !race.isLegacy))
    .forEach((race) => {
      logger.debug(`${race.fullName} features parsing started...`);
      race.racialTraits.forEach((trait) => {
        logger.debug(`${trait.definition.name} trait starting...`);
        if (!trait.definition.hideInSheet && !NO_TRAITS.includes(trait.definition.name)) {
          const parsedTrait = getRacialTrait(trait.definition, race.fullName, race.isLegacy);
          racialFeatures.push(parsedTrait);
          results.push({ race: race.fullName, trait: trait.definition.name });
        }
      });
    });

  const fiddledRacialFeatures = await srdFiddling(racialFeatures, "traits");
  munchNote(`Importing ${fiddledRacialFeatures.length} traits!`, true);
  logger.debug("Generated Racial Traits", fiddledRacialFeatures);
  await updateCompendium("traits", { traits: fiddledRacialFeatures }, updateBool, ["entityRaceId"]);

  const compendiumRacialTraits = await getRacialTraitsLookup(fiddledRacialFeatures);

  await Promise.allSettled(data
    .filter((race) => !excludeLegacy || (excludeLegacy && !race.isLegacy))
    .map(async (race) => {
      logger.debug(`${race.fullName} race parsing started...`);
      const builtRace = await buildRace(race, compendiumRacialTraits);
      races.push(builtRace);
    })
  );

  logger.debug("Pre-fiddled races", duplicate(races));

  const fiddledRaces = await srdFiddling(races, "races");
  munchNote(`Importing ${fiddledRaces.length} races!`, true);

  logger.debug("Fiddled races", fiddledRaces);

  await updateCompendium("races", { races: fiddledRaces }, updateBool, ["entityRaceId"]);

  return results;
}
