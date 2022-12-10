import logger from "../../logger.js";
import { generateBackground } from "../../parser/character/bio.js";
import { parseTags } from "../../lib/DDBTemplateStrings.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { updateCompendium, srdFiddling, daeFiddling } from "../import.js";
import DDBMuncher from "../DDBMuncher.js";
import { generateTable } from "../table.js";

const BACKGROUND_TEMPLATE = {
  "name": "",
  "type": "background",
  "system": {
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
        "type": "background"
      }
    },
  },
  "img": "icons/skills/trades/academics-book-study-purple.webp",
};

function buildBase(data) {
  let result = duplicate(BACKGROUND_TEMPLATE);
  const bgData = generateBackground(data);
  result.name = data.name;
  result.system.description.value += `${bgData.description}\n\n`;

  result.flags.ddbimporter = {
    featId: data.id,
    version: CONFIG.DDBI.version,
  };

  result.system.source = DDBHelper.parseSource(data);
  result.system.description.value = parseTags(result.system.description.value);
  result.system.description.value = generateTable(result.name, result.system.description.value, true, "background");

  return result;
}


function buildBackground(background) {
  let result = buildBase(background);

  return result;
}


export async function getBackgrounds(data) {
  logger.debug("get backgrounds started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let backgrounds = [];

  // console.warn(data);

  data.forEach((background) => {
    logger.debug(`${background.name} background parsing started...`);
    const parsedBackground = buildBackground(background);
    backgrounds.push(parsedBackground);
  });

  // console.warn("backgrounds", backgrounds);

  const fiddledBackgrounds = await srdFiddling(backgrounds, "backgrounds");
  const finalBackgrounds = await daeFiddling(fiddledBackgrounds);

  DDBMuncher.munchNote(`Importing ${finalBackgrounds.length} backgrounds!`, true);
  await updateCompendium("backgrounds", { backgrounds: finalBackgrounds }, updateBool);

  return finalBackgrounds;
}
