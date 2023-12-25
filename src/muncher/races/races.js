/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import DDBRace from "../../parser/race/DDBRace.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import DDBRaceTrait from "../../parser/race/DDBRaceTrait.js";

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

  const excludeLegacy = game.settings.get("ddb-importer", "munching-policy-exclude-legacy");
  data
    .filter((race) => !excludeLegacy || (excludeLegacy && !race.isLegacy))
    .forEach((race) => {
      logger.debug(`${race.fullName} features parsing started...`);
      race.racialTraits.forEach((trait) => {
        logger.debug(`${trait.definition.name} trait starting...`);
        if (!trait.definition.hideInSheet && !NO_TRAITS.includes(trait.definition.name)) {
          const ddbTrait = new DDBRaceTrait(trait.definition, race.fullName, { isLegac: race.isLegacyy });
          racialFeatures.push(ddbTrait.data);
          results.push({ race: race.fullName, trait: trait.definition.name });
        }
      });
    });

  const traitHelper = await DDBItemImporter.buildHandler("traits", racialFeatures, updateBool, { chrisPremades: true, matchFlags: ["entityRaceId"] });
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traitHelper.documents);
  const filteredRaces = data.filter((race) => !excludeLegacy || (excludeLegacy && !race.isLegacy));

  for (const race of filteredRaces) {
    logger.debug(`${race.fullName} race parsing started...`);
    const ddbRace = new DDBRace(null, race, compendiumRacialTraits);
    await ddbRace.build();
    races.push(ddbRace.data);
  }

  logger.debug("Pre-fiddled races", duplicate(races));
  await DDBItemImporter.buildHandler("races", races, updateBool, { matchFlags: ["entityRaceId"] });

  return results;
}
