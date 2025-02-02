

//

import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getFlamingSphere({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getFlamingSphere", {
    ddbParser,
    document,
    raw,
    text,
  });

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Flaming Sphere",
    "prototypeToken": {
      name: "Flaming Sphere",
      width: 1,
      height: 1,
      disposition: 1,
      texture: {
        src: "icons/magic/fire/flame-burning-earth-yellow.webp",
        scaleX: 1,
        scaleY: 1,
      },
      "light": {
        "negative": false,
        "priority": 0,
        "alpha": 0.5,
        "angle": 360,
        "bright": 20,
        "color": null,
        "coloration": 1,
        "dim": 40,
        "attenuation": 0.5,
        "luminosity": 0.5,
        "saturation": 0,
        "contrast": 0,
        "shadows": 0,
        "animation": {
          "type": "torch",
          "speed": 3,
          "intensity": 3,
          "reverse": false,
        },
        "darkness": {
          "min": 0,
          "max": 1,
        },
      },
    },
    system: {
      "traits.size": "med",
      "details.type": {
        value: null,
        custom: "Summon",
      },
      "attributes": {
        "movement": {
          "walk": 30,
        },
      },
    },
    img: "icons/magic/fire/flame-burning-earth-yellow.webp",
    items: [],
  });

  const desArray = raw.split("Using a Higher-Level Spell Slot")[0].split("At Higher Levels")[0].split("As a");

  const description = `<p><em><strong>Flame Damage.</strong></em> ${desArray[0].replace("<p>", "")}</p>`
    .replace("<p></p>", "");

  const bonusParsed = desArray[1].replace("</p>\r\n<p>", "");
  const bonusDescription = `<p><em><strong>Move and Attack.</strong></em> As a${bonusParsed}</p>`
    .replace("<p><strong><em></p>", "");

  const manager = new DDBCompanionMixin(description, {}, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(description, "action");
  stub.items.push(...features);
  const bonusFeatures = await manager.getFeature(bonusDescription, "bonus");
  stub.items.push(...bonusFeatures);
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  // console.warn("Flaming Sphere", {
  //   stub: deepClone(stub),
  //   enriched,
  //   description,
  //   bonusDescription,
  //   raw,
  // });

  const result = {
    FlamingSphere: {
      name: "Flaming Sphere",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Flaming Sphere",
      data: stub,
    },
  };

  logger.verbose("Flaming Sphere result", result);
  return result;
}
