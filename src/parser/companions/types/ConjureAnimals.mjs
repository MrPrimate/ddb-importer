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

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Conjured Animals",
    "prototypeToken": {
      name: "Conjured Animals",
      width: 2,
      height: 2,
      disposition: 1,
      texture: {
        src: "systems/dnd5e/tokens/beast/GiantWolfSpider.webp",
        scaleX: 1,
        scaleY: 1,
      },
    },
    system: {
      traits: {
        size: "lg",
      },
      type: {
        value: null,
        custom: "Summon",
      },
    },
    img: "systems/dnd5e/tokens/beast/GiantWolfSpider.webp",
  });
  const packDamage = `<p><em><strong>Pack Damage.</strong></em> Dexterity Saving Throw: against your spell save DC. A creature with 10 feet. Failure: 15 (3d10) Slashing damage.</p>`;
  const manager = new DDBCompanionMixin(packDamage, {}, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(packDamage, "action");
  stub.items = features;
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  // console.warn("Conjure Animals", {
  //   stub: deepClone(stub),
  //   enriched,
  // });

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
