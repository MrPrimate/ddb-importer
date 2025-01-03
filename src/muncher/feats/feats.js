import {
  logger,
  DDBItemImporter,
  utils,
  DDBSources,
} from "../../lib/_module.mjs";
import { DDBReferenceLinker } from "../../parser/lib/_module.mjs";

const FEAT_TEMPLATE = {
  "name": "",
  "type": "feat",
  "system": {
    "description": {
      "value": "",
      "chat": "",
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
        "type": "feat",
      },
    },
  },
  "img": null,
};

function buildBase(data) {
  let result = foundry.utils.duplicate(FEAT_TEMPLATE);

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

  result.system.source = DDBSources.parseSource(data);

  result.system.description.value = DDBReferenceLinker.parseTags(result.system.description.value);

  return result;
}


async function buildFeat(feat) {
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

  const itemHandler = await DDBItemImporter.buildHandler("feats", feats, updateBool, {
    chrisPremades: true,
    notifier: utils.munchNote,
  });
  return itemHandler.documents;
}
