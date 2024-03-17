/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import { generateBackground } from "../../parser/character/bio.js";
// import { parseTags } from "../../lib/DDBReferenceLinker.js";
import DDBHelper from "../../lib/DDBHelper.js";
// import { generateTable } from "../table.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import DDBFeature from "../../parser/features/DDBFeature.js";

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

//   result.system.source = DDBHelper.parseSource(data);
//   result.system.description.value = parseTags(result.system.description.value);
//   result.system.description.value = await generateTable(result.name, result.system.description.value, true, "background");

//   return result;
// }


async function buildBackground(backgroundData) {
  let featDefinition = generateBackground(backgroundData);

  const source = DDBHelper.parseSource(featDefinition);
  const ddbFeature = new DDBFeature({
    ddbData: null,
    ddbDefinition: featDefinition,
    rawCharacter: null,
    type: "background",
    source,
    noMods: true,
  });

  ddbFeature.build();
  logger.debug(`DDBFeatures.getFeaturesFromDefinition: ${ddbFeature.ddbDefinition.name}`, {
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

  const itemHandler = await DDBItemImporter.buildHandler("backgrounds", backgrounds, updateBool, { chrisPremades: true });
  return itemHandler.documents;
}
