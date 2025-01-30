import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getConjureAnimals({
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

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
    "name": "Conjured Animals",
    "prototypeToken": {
      name: "Conjured Animals",
      width: 2,
      height: 2,
      texture: {
        src: "systems/dnd5e/tokens/beast/GiantWolfSpider.webp",
        scaleX: 1,
        scaleY: 1,
      },
    },
    "system.traits.size": "lg",
    img: "systems/dnd5e/tokens/beast/GiantWolfSpider.webp",
  });
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const packDamage = `<p><em><strong>Pack Damage.</em></strong> Dexterity Saving Throw: against your spell save DC. A creature with 10 feet. Failure: 15 (3d10) Bludgeoning damage.</p>`;
  const manager = new DDBCompanionMixin(packDamage, {});
  manager.npc = stub;

  // console.warn("Getting feature", manager);
  const features = await manager.getFeature(packDamage, "action");
  // console.warn(features);
  stub.items = features;
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");
  const result = {
    ConjureAnimals: {
      name: "Conjure Animals",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Conjure Animals",
      data: stub,
    },
  };

  logger.verbose("Conjure Animals result", result);
  return result;
}
