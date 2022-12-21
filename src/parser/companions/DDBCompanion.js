import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import { newNPC } from "../monster/templates/monster.js";

export default class DDBCompanion {

  constructor(block, options = {}) {
    console.warn("DDBCompanion", { block });
    this.options = options;
    this.block = block;
    this.npc = null;
    this.data = {};
    this.parsed = false;
  }

  #generateAbilities() {
    const abilityNodes = this.block.querySelector("div.stat-block-ability-scores");

    abilityNodes.querySelectorAll("div.stat-block-ability-scores-stat").forEach((aNode) => {
      const ability = aNode.querySelector("div.stat-block-ability-scores-heading").innerText.toLowerCase();
      const value = Number.parseInt(aNode.querySelector("span.stat-block-ability-scores-score").innerText);
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

      this.npc.system.abilities[ability]['value'] = value;
      this.npc.system.abilities[ability]['mod'] = mod;
    });
  }

  #generateSize() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Metadata").innerHTML;

    const size = data.split(" ")[0];
    const sizeData = DICTIONARY.sizes.find((s) => size.toLowerCase() == s.name.toLowerCase())
      ?? { name: "Medium", value: "med", size: 1 };

    this.npc.system.traits.size = sizeData.value;
    this.npc.prototypeToken.width = sizeData.size >= 1 ? sizeData.size : 1;
    this.npc.prototypeToken.height = sizeData.size >= 1 ? sizeData.size : 1;
    this.npc.prototypeToken.scale = sizeData.size >= 1 ? 1 : sizeData.size;
  }

  #generateType() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Metadata").innerHTML;
    const typeName = data.split(" ").pop().toLowerCase();

    if (CONFIG.DND5E.creatureTypes[typeName]) {
      this.npc.system.details.type.value = typeName;
    } else {
      this.npc.system.details.type.value = "Unknown";
    }
  }

  async parse() {
    console.warn("PARSE COMPANION", { block: this.block, aThis: this });
    const name = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Title").innerHTML;

    if (!name) return;
    logger.debug(`Beginning companion parse for ${name}`, { name, block: this.block });

    this.npc = await newNPC(name);
    setProperty(this.npc, "flags.ddbimporter.companion.modifiers", {});
    this.npc.prototypeToken.name = name;

    this.#generateSize();
    this.#generateType();
    this.#generateAbilities();

    this.data = duplicate(this.npc);
    this.parsed = true;

    logger.debug(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
    console.warn(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
  }

}
