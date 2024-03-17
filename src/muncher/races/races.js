/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import DDBRace from "../../parser/race/DDBRace.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import DDBRaceTrait from "../../parser/race/DDBRaceTrait.js";
import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";

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
  "Creature Type",
  "Darkvision",
  "Keen Senses",
  "Natural Athlete",
  "Necrotic Resistance",
  "Skills",
  "Skill Versatility",
];

export async function getRaces(data) {
  logger.debug("get races started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let results = [];
  let races = [];
  let racialFeatures = [];

  const traitCompendiumFolders = new DDBCompendiumFolders("traits");
  await traitCompendiumFolders.loadCompendium("traits");

  const excludeLegacy = game.settings.get("ddb-importer", "munching-policy-exclude-legacy");
  const filteredRaces = data.filter((race) => !excludeLegacy || (excludeLegacy && !race.isLegacy));

  for (const race of filteredRaces) {
    logger.debug(`${race.fullName} features parsing started...`);
    const groupName = DDBRace.getGroupName(race.groupIds, race.baseRaceName);
    // await traitCompendiumFolders.getRacialBaseFolder("trait", groupName);
    for (const trait of race.racialTraits) {
      logger.debug(`${trait.definition.name} trait starting...`);
      if (!trait.definition.hideInSheet && !NO_TRAITS.includes(trait.definition.name)) {
        const ddbTrait = new DDBRaceTrait(trait.definition, race);
        racialFeatures.push(ddbTrait.data);
        results.push({ race: race.fullName, trait: trait.definition.name });
        await traitCompendiumFolders.createSubTraitFolders(groupName, race.fullName);
      }
    }
  }

  const raceCompendiumFolders = new DDBCompendiumFolders("races");
  await raceCompendiumFolders.loadCompendium("races");
  const traitOptions = { chrisPremades: true, matchFlags: ["entityRaceId"], useCompendiumFolders: true };

  const traitHelper = await DDBItemImporter.buildHandler("traits", racialFeatures, updateBool, traitOptions);
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traitHelper.documents);

  for (const race of filteredRaces) {
    logger.debug(`${race.fullName} race parsing started...`);
    const ddbRace = new DDBRace(null, race, compendiumRacialTraits);
    await ddbRace.build();
    await raceCompendiumFolders.getRacialBaseFolder("race", ddbRace.groupName);
    races.push(ddbRace.data);
  }

  logger.debug("Pre-fiddled races", foundry.utils.duplicate(races));
  const raceOptions = { matchFlags: ["entityRaceId"], useCompendiumFolders: true };
  await DDBItemImporter.buildHandler("races", races, updateBool, raceOptions);

  return results;
}
