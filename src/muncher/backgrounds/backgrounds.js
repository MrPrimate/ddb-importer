// import { generateBackground } from "../../parser/character/bio.js";
import { logger, DDBItemImporter, utils, DDBSources } from "../../lib/_module.mjs";
// import { parseTags } from "../../lib/DDBReferenceLinker.js";
// import DDBFeature from "../../parser/features/DDBFeature.js";

function generateBackground(data) {
  return data;
}

class DDBFeature {

}

// const BACKGROUND_TEMPLATE = {
//   "name": "",
//   "type": "background",
//   "system": {
//     "description": {
//       "value": "",
//       "chat": "",
//     },
//     "type": {
//       "value": "background",
//     },
//     "source": "",
//   },
//   "sort": 2600000,
//   "flags": {
//     "ddbimporter": {},
//     "obsidian": {
//       "source": {
//         "type": "background"
//       }
//     },
//   },
//   "img": "icons/skills/trades/academics-book-study-purple.webp",
// };

// async function buildBase(data) {
//   let result = foundry.utils.duplicate(BACKGROUND_TEMPLATE);
//   const bgData = generateBackground(data);
//   result.name = data.name;
//   result.system.description.value += `${bgData.description}\n\n`;

//   result.flags.ddbimporter = {
//     featId: data.id,
//     version: CONFIG.DDBI.version,
//   };

//   result.system.source = DDBSources.parseSource(data);
//   result.system.description.value = parseTags(result.system.description.value);
//   result.system.description.value = await generateTable(result.name, result.system.description.value, true, "background");

//   return result;
// }


async function buildBackground(backgroundData) {
  let featDefinition = generateBackground(backgroundData);

  const source = DDBSources.parseSource(featDefinition);
  const ddbFeature = new DDBFeature({
    ddbData: null,
    ddbDefinition: featDefinition,
    rawCharacter: null,
    type: "background",
    source,
    isGeneric: true,
  });

  ddbFeature.build();
  logger.debug(`DDBFeatures.buildBackground: ${ddbFeature.ddbDefinition.name}`, {
    ddbFeature,
    featDefinition,
  });

  await ddbFeature.generateAdvancements();
  const featIds = foundry.utils.getProperty(backgroundData, "featList.featIds") ?? [];
  await ddbFeature.buildBackgroundFeatAdvancements(featIds);

  return ddbFeature.data;

}


export async function getBackgrounds(data) {
  logger.debug("get backgrounds started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let backgrounds = [];

  for (const background of data) {
    logger.debug(`${background.name} background parsing started...`);
    const parsedBackground = await buildBackground(background);
    backgrounds.push(parsedBackground);
  }

  const itemHandler = await DDBItemImporter.buildHandler("backgrounds", backgrounds, updateBool, {
    chrisPremades: true,
    notifier: utils.munchNote,
  });
  return itemHandler.documents;
}
