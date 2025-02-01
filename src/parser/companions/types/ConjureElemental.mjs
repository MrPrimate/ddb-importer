import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


export async function getConjureElemental({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getConjureElemental", {
    ddbParser,
    document,
    raw,
    text,
  });

  const elementals = [
    {
      name: "Air",
      type: "lightning",
      token: "",
      avatar: "",
    },
    {
      name: "Earth",
      type: "thunder",
      token: "",
      avatar: "",
    },
    {
      name: "Fire",
      type: "fire",
      token: "",
      avatar: "",
    },
    {
      name: "Water",
      type: "cold",
      token: "",
      avatar: "",
    },
  ];

  const result = {};
  for (const elemental of elementals) {

    let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
      "name": `Conjured ${elemental.name} Elemental`,
      "prototypeToken": {
        name: `Conjured ${elemental.name} Elemental`,
        width: 2,
        height: 2,
        disposition: 1,
        texture: {
          src: elemental.token,
          scaleX: 1,
          scaleY: 1,
        },
      },
      "system.traits.size": "lg",
      system: {
        "traits.size": "lg",
        "details.type": {
          value: null,
          custom: "Summon",
        },
      },
      img: elemental.avatar,
    });

    const text = raw.split("the duration.</p>\n").pop();
    const action = `<p><em><strong>${elemental.name} Element.</em></strong> ${text}</p>`;

    const manager = new DDBCompanionMixin(action, {}, { addMonsterEffects: true });
    manager.npc = stub;
    const features = await manager.getFeature(action, "action");
    stub.items = features;
    stub = await DDBCompanionMixin.addEnrichedImageData(stub);
    const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");


    // console.warn(`Conjure Elemental ${elemental.name}`, {
    //   stub: foundry.utils.deepClone(stub),
    //   enriched,
    // });

    result[`ConjureElemental${elemental.name}`] = {
      name: `Conjure ${elemental.name} Elemental`,
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Conjure Elementals`,
      data: stub,
    };

  }

  logger.verbose("Conjure Elemental result", result);
  return result;
}
