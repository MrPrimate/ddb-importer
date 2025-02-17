import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getSpiritualWeapons({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getSpiritualWeapons", {
    ddbParser,
    document,
    raw,
    text,
  });

  const result = {};


  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": `Spiritual Weapon`,
    "prototypeToken": {
      name: `Spiritual Weapon`,
      width: 1,
      height: 1,
      disposition: 1,
      texture: {
        src: "modules/ddb-importer/img/jb2a/SpiritualWeapon_Shortsword01_02_Spectral_Green_400x400.webm",
        scaleX: 2,
        scaleY: 2,
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
    img: "modules/ddb-importer/img/jb2a/SpiritualWeapon_Shortsword01_02_Spectral_Green_Thumb.webp",
  });

  const action = `<p><em><strong>Move and Attack.</strong></em> ${raw.split("<p><strong><em>Using a Higher-Level")[0]}</p>`;

  const manager = new DDBCompanionMixin(action, {}, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(action, "bonus");
  stub.items = features;
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  result[`SpiritualWeaponShortSword`] = {
    name: `Spiritual Weapon`,
    version: enriched ? "2" : "1",
    required: null,
    isJB2A: true,
    needsJB2A: false,
    needsJB2APatreon: false,
    folderName: `Spiritual Weapon`,
    data: stub,
  };


  logger.verbose("Spiritual Weapon result", result);
  return result;
}
