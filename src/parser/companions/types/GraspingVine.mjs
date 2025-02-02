import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getGraspingVines({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getGraspingVines", {
    ddbParser,
    document,
    raw,
    text,
  });

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Grasping Vine",
    "prototypeToken": {
      name: "Grasping Vine",
      disposition: 1,
      texture: {
        src: "icons/magic/nature/root-vine-beanstalk-moon.webp",
        scaleX: 1,
        scaleY: 1,
      },
    },
    system: {
      "details.type": {
        value: null,
        custom: "Summon",
      },
    },
    img: "icons/magic/nature/root-vine-beanstalk-moon.webp",
  });

  const description = `<p><em><strong>Vine Attack.</strong></em> ${raw.split("\r\n")[1].replace("<p>", "")}</p>`;

  const manager = new DDBCompanionMixin(description, {}, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(description, "action");
  stub.items = features;
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  console.warn("Grasping Vine", {
    stub: deepClone(stub),
    enriched,
  });

  const result = {
    GraspingVine: {
      name: "Grasping Vine",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Grasping Vine",
      data: stub,
    },
  };

  logger.verbose("Grasping Vine result", result);
  return result;
}
