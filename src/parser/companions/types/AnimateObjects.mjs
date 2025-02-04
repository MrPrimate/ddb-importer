import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getAnimateObjects2014({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getAnimateObjects2014", {
    ddbParser,
    document,
    raw,
    text,
  });

  const summonHints = [
    {
      size: "tiny",
      img: "icons/sundries/misc/key-short-glowing.webp",
      hp: 10,
    },
    {
      size: "sm",
      img: "icons/sundries/books/book-clasp-spiral-green.webp",
      hp: 10,
    },
    {
      size: "med",
      img: "icons/sundries/books/book-clasp-spiral-green.webp",
      hp: 10,
    },
    {
      size: "lg",
      img: "icons/sundries/books/book-clasp-spiral-green.webp",
      suffix: " (Counts as two)",
      hp: 20,
    },
    {
      size: "huge",
      img: "icons/sundries/books/book-clasp-spiral-green.webp",
      suffix: " (Counts as three)",
      hp: 40,
    },

    // icons/creatures/magical/construct-gargoyle-stone-gray.webp
  ];

  const result = {};
  for (const data of summonHints) {

    const size = CONFIG.DND5E.actorSizes[data.size];

    let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
      "name": `Animated Object (${size.label})`,
      "prototypeToken": {
        name: `Animated Object (${size.label})`,
        width: size.token,
        height: size.token,
        disposition: 1,
        texture: {
          src: data.img ?? "icons/sundries/books/book-clasp-spiral-green.webp",
          scaleX: 1,
          scaleY: 1,
        },
      },
      system: {
        traits: {
          size: data.size,
          ci: ["poisoned", "charmed", "exhaustion", "frightened", "paralyzed"],
          di: ["poison", "psychic"],
        },
        details: {
          type: {
            value: null,
            custom: "Summon",
          },
        },
        abilities: {
          "str.value": 16,
          "dex.value": 10,
          "con.value": 10,
          "int.value": 3,
          "wis.value": 3,
          "cha.value": 1,
        },
        "hp.flat": data.hp,
        "ac.flat": 15,
      },
      img: data.img ?? "icons/sundries/books/book-clasp-spiral-green.webp",
    });

    const text = raw.split("Slam.").pop();
    const action = `<p><em><strong>Slam.</strong></em> ${text}</p>`;

    const manager = new DDBCompanionMixin(action, {}, { addMonsterEffects: true });
    manager.npc = stub;
    const features = await manager.getFeature(action, "action");
    stub.items = features;
    stub = await DDBCompanionMixin.addEnrichedImageData(stub);
    const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

    // eslint-disable-next-line no-console
    console.warn(`Animate Objects ${data.name}`, {
      stub: foundry.utils.deepClone(stub),
      enriched,
      raw, action,
    });

    result[`AnimateObject${size.label}`] = {
      name: `Animated Object ${size.label}${data.suffix ?? ""}`,
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Animate Objectss`,
      data: stub,
    };

  }

  logger.verbose("Animate Objects result", result);
  return result;
}
