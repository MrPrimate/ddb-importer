import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getConjureFey({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getConjureAnimals", {
    ddbParser,
    document,
    raw,
    text,
  });

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Conjured Fey",
    "prototypeToken": {
      name: "Conjured Fey",
      width: 1,
      height: 1,
      disposition: 1,
      texture: {
        src: "systems/dnd5e/tokens/beast/GiantWolfSpider.webp",
        scaleX: 1,
        scaleY: 1,
      },
    },
    system: {
      traits: {
        size: "med",
      },
      details: {
        type: {
          value: null,
          custom: "Summon",
        },
      },
    },
    img: "systems/dnd5e/tokens/beast/GiantWolfSpider.webp",
  });

  const descriptionArray1 = raw.split("Fey creature of your choice.").pop().trim();
  const descriptionArray2 = descriptionArray1.split("</p>");

  const description = `<p><em><strong>Psychic Attack.</strong></em> ${descriptionArray2[0]}</p>`;

  const manager = new DDBCompanionMixin(description, {}, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(description, "action");
  stub.items = features;
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  // console.warn("Conjure Fey", {
  //   stub: deepClone(stub),
  //   enriched,
  //   descriptionArray2,
  //   description,
  // });

  const result = {
    ConjureFey: {
      name: "Conjure Fey",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Conjure Fey",
      data: stub,
    },
  };

  logger.verbose("Conjure Fey result", result);
  return result;
}
