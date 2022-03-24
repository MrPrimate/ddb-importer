import logger from "../../logger.js";
import { parseTags } from "../../parser/templateStrings.js";
import utils from "../../utils.js";
import { updateCompendium, srdFiddling, daeFiddling } from "../import.js";
import { munchNote } from "../utils.js";

const FEAT_TEMPLATE = {
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
        "type": "feat"
      }
    },
  },
  "img": null
};

function buildBase(data) {
  let result = duplicate(FEAT_TEMPLATE);

  result.name = data.name;
  result.system.description.value += `${data.description}\n\n`;
  result.system.description.chat += `${data.snippet}\n\n`;

  result.flags.ddbimporter = {
    featId: data.id,
    version: CONFIG.DDBI.version,
  };

  result.flags.ddbimporter['prerequisites'] = data.prerequisites;
  if (data.prerequisites.length > 0) {
    const requirements = data.prerequisites.map((requirement) => requirement.description);
    result.system.requirements = requirements.join(", ");
    result.system.description.value += `<h3>Requirements</h3>\n\n${requirements.join("\n\n")}\n\n`;
  }

  result.system.source = utils.parseSource(data);

  result.system.description.value = parseTags(result.system.description.value);

  return result;
}


async function buildFeat(feat,) {
  let result = buildBase(feat);

  return result;
}


export async function getFeats(data) {
  logger.debug("get feats started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let feats = [];

  data.forEach((feat) => {
    logger.debug(`${feat.name} feat parsing started...`);
    const parsedFeat = buildFeat(feat);
    feats.push(parsedFeat);
  });

  const fiddledFeats = await srdFiddling(feats, "feats");
  const finalFeats = await daeFiddling(fiddledFeats);

  munchNote(`Importing ${finalFeats.length} feats!`, true);
  await updateCompendium("feats", { feats: finalFeats }, updateBool);

  return finalFeats;
}
