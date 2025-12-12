import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";

export async function getBladeOfDisaster({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getBladeOfDisaster", {
    ddbParser,
    document,
    raw,
    text,
  });

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Blade of Disaster",
    "prototypeToken": {
      name: "Blade of Disaster",
      width: 1,
      height: 1,
      texture: {
        src: "icons/skills/melee/strike-sword-blood-red.webp",
        scaleX: 0.5,
        scaleY: 0.5,
      },
    },
    system: {
      "traits.size": "sm",
      details: {
        type: {
          value: null,
          custom: "Summon",
        },
      },
    },
    img: "icons/skills/melee/strike-sword-blood-red.webp",
  });

  const action = `<p><em><strong>Move and Attack.</strong></em> ${raw}</p>`;


  const manager = new DDBCompanionMixin(action, {}, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(action, "action");
  stub.items = features;
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  const result = {
    BladeOfDisaster: {
      name: "Blade of Disaster",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Blade of Disaster",
      data: stub,
    },
  };

  logger.verbose("Blade of Disaster result", result);

  return result;
}
