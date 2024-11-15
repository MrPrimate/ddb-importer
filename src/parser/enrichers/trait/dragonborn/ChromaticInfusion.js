/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChromaticInfusion extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      name: "Chromatic Infusion",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get effects() {
    return [
      { type: "acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
      { type: "cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
      { type: "fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
      { type: "lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
      { type: "poison", img: "icons/skills/toxins/poison-bottle-corked-fire-green.webp" },
    ].map((element) => {
      return {
        type: "enchant",
        name: `Chromatic Infusion: ${utils.capitalize(element.type)}`,
        data: {
          img: element.img,
        },
        changes: [
          DDBEnricherData.generateOverrideChange(`{} [Chromatic Infusion ${utils.capitalize(element.type)}]`, 20, "name"),
          DDBEnricherData.generateUnsignedAddChange(`[["1d4", "${element.type}"]]`, 20, "system.damage.parts"),
        ],
      };
    });
  }

}
