import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getGuardianOfFaith({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getGuardianOfFaith", {
    ddbParser,
    document,
    raw,
    text,
  });

  const version = ddbParser.is2014 ? "2014" : "2024";

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Guardian of Faith",
    "prototypeToken": {
      name: "Guardian of Faith",
      width: 2,
      height: 2,
      disposition: 1,
      texture: {
        scaleX: 1,
        scaleY: 1,
      },
    },
    system: {
      traits: {
        size: "lg",
      },
      details: {
        type: {
          value: null,
          custom: "Summon",
        },
      },
      source: {
        rules: version,
      },
    },
  });

  const split = ddbParser.is2014 ? "<p>Any creature hostile" : "?<p>Any enemy that";

  const actionText = raw.split(split).pop();
  const description = `<p><em><strong>Guardian Aura.</strong></em> ${split}${actionText}`;
  const manager = new DDBCompanionMixin(description, { forceRulesVersion: version }, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(description, "special");
  stub.items = features;
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  const result = {
    [`GuardianOfFaith${version}`]: {
      name: "Guardian of Faith",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Guardian of Faith`,
      data: stub,
    },
  };

  logger.verbose("Guardian of Faith result", result);
  return result;
}
