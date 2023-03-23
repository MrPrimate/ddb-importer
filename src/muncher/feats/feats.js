import logger from "../../logger.js";
import { parseTags } from "../../lib/DDBTemplateStrings.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { updateCompendium, srdFiddling, daeFiddling } from "../import.js";
import DDBMuncher from "../../apps/DDBMuncher.js";
import { applyChrisPremadeEffects } from "../../effects/chrisPremades.js";

const FEAT_TEMPLATE = {
  "name": "",
  "type": "feat",
  "system": {
    "description": {
      "value": "",
      "chat": "",
      "unidentified": ""
    },
    "type": {
      "value": "feat",
    },
    "source": "",
  },
  "sort": 2600000,
  "flags": {
    "ddbimporter": {
      "type": "feat",
    },
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

  result.system.source = DDBHelper.parseSource(data);

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
  const daeFeats = await daeFiddling(fiddledFeats);
  const finalFeats = await applyChrisPremadeEffects({ documents: daeFeats, compendiumItem: true });

  DDBMuncher.munchNote(`Importing ${finalFeats.length} feats!`, true);
  await updateCompendium("feats", { feats: finalFeats }, updateBool);

  return finalFeats;
}
