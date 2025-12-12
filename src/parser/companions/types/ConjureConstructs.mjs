import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getConjureConstructs2024({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getConjureConstructs2024", {
    ddbParser,
    document,
    raw,
    text,
  });

  const result = {};

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": `Conjured Construct`,
    "prototypeToken": {
      name: `Conjured Construct`,
      width: 2,
      height: 2,
      disposition: 1,
      alpha: 0.7,
      texture: {
        src: "icons/creatures/magical/construct-stone-earth-gray.webp",
        scaleX: 1,
        scaleY: 1,
        tint: "#528e6c",
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
    },
    img: "icons/creatures/magical/construct-stone-earth-gray.webp",
  });

  const text1 = raw.split("effects:</p>\r\n").pop().split("</p>\r\n")[0];
  const action1 = `${text1}</p>`;
  const text2 = raw.split("successful one.</p>\r\n").pop().split("</p>\r\n")[0];
  const action2 = `${text2}</p>`;

  const manager = new DDBCompanionMixin(raw, {}, { addMonsterEffects: true });
  manager.npc = stub;
  const features1 = await manager.getFeature(action1, "action");
  const features2 = await manager.getFeature(action2, "action");

  stub.items = features1.concat(features2);
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  result[`ConjureConstructs2024`] = {
    name: `Conjure Constructs`,
    version: enriched ? "2" : "1",
    required: null,
    isJB2A: false,
    needsJB2A: false,
    needsJB2APatreon: false,
    folderName: `Conjure Constructs (2024)`,
    data: stub,
  };


  logger.verbose("Conjure Constructs result", result);
  return result;
}
