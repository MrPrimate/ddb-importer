import utils from "../../utils.js";
import logger from "../../logger.js";

const CLASS_TEMPLATE = {
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
  },
  "img": null
};

export function buildBase(data) {
  let result = JSON.parse(JSON.stringify(CLASS_TEMPLATE));

  result.name = data.name;
  result.data.description.value += `${data.description}\n\n`;

  result.flags.ddbimporter = {
    classId: data.id,
  };

  if (data.moreDetailsUrl) {
    result.flags.ddbimporter['moreDetailsUrl'] = data.moreDetailsUrl;
  }

  result.data.source = utils.parseSource(data);

  return result;
}
export function getClassFeature(feature, className, subClassName) {
  logger.debug("Class feature build started");

  let result = buildBase(feature);

  result.flags.ddbimporter['featureId'] = feature.id;
  result.flags.ddbimporter['requiredLevel'] = feature.requiredLevel;
  result.flags.ddbimporter['prerequisite'] = feature.prerequisite;
  result.flags.ddbimporter['class'] = className;
  result.flags.ddbimporter['subClass'] = "";

  return result;
}
