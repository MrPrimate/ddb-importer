/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import { parseTags } from "../../lib/DDBTemplateStrings.js";
import DDBRace from "../../parser/race/DDBRace.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";

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

function getRacialTrait(trait, fullName, isLegacy) {
  logger.debug("Race trait build started");

  const traitBase = new DDBRace(trait, null);
  let result = traitBase.buildBase();

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

  result.system.type = {
    value: "race",
  };

  result.system.description.value = parseTags(result.system.description.value);

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

  const traitHelper = await DDBItemImporter.buildHandler("traits", racialFeatures, updateBool, { chrisPremades: true, matchFlags: ["entityRaceId"] });
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traitHelper.documents);
  const filteredRaces = data.filter((race) => !excludeLegacy || (excludeLegacy && !race.isLegacy));

  for (const race of filteredRaces) {
    logger.debug(`${race.fullName} race parsing started...`);
    const ddbRace = new DDBRace(race, compendiumRacialTraits);
    const builtRace = await ddbRace.buildRace();
    races.push(builtRace);
  }

  logger.debug("Pre-fiddled races", duplicate(races));
  await DDBItemImporter.buildHandler("races", races, updateBool, { matchFlags: ["entityRaceId"] });

  return results;
}
