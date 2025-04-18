import {
  logger,
  DDBItemImporter,
  DDBCompendiumFolders,
  utils,
} from "../../lib/_module.mjs";
import DDBRace from "../../parser/race/DDBRace.js";
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

  for (const race of data) {
    logger.debug(`${race.fullName} features parsing started...`);
    const groupName = DDBRace.getGroupName(race.groupIds, race.baseRaceName);
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
  const traitOptions = {
    chrisPremades: true,
    matchFlags: ["fullRaceName", "groupName"],
    useCompendiumFolders: true,
    notifier: utils.munchNote,
  };

  const traitHelper = await DDBItemImporter.buildHandler("traits", racialFeatures, updateBool, traitOptions);
  const compendiumRacialTraits = await DDBRace.getRacialTraitsLookup(traitHelper.documents);

  for (const race of data) {
    logger.debug(`${race.fullName} race parsing started...`);
    const ddbRace = new DDBRace(null, race, compendiumRacialTraits, true);
    await ddbRace.build();
    await raceCompendiumFolders.getSpeciesBaseFolder(ddbRace.groupName);
    races.push(ddbRace.data);
  }

  logger.debug("Pre-fiddled races", foundry.utils.duplicate(races));
  const raceOptions = {
    matchFlags: ["fullRaceName", "groupName"],
    useCompendiumFolders: true,
    notifier: utils.munchNote,
  };
  await DDBItemImporter.buildHandler("races", races, updateBool, raceOptions);

  return results;
}
