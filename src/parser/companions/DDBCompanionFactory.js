import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBCompanion from "./DDBCompanion.js";

export default class DDBCompanionFactory {

  constructor(ddbCharacter, html, options = {}) {
    console.warn("html", html);
    this.options = options;
    this.ddbCharacter = ddbCharacter;
    this.html = html;
    this.doc = new DOMParser().parseFromString(html.replaceAll("\n", ""), 'text/html');
    this.companions = [];
  }

  static MULTI = {
    "Aberrant Spirit": ["Slaad", "Beholderkin", "Star Spawn"],
    "Bestial Spirit": ["Air", "Land", "Water"],
    "Celestial Spirit": ["Avenger", "Defender"],
    "Construct Spirit": ["Clay", "Metal", "Stone"],
    "Elemental Spirit": ["Air", "Earth", "Fire", "Water"],
    "Fey Spirit": ["Fuming", "Mirthful", "Tricksy"],
    "Fiendish Spirit": ["Demon", "Devil", "Yugoloth"],
    "Shadow Spirit": ["Fury", "Despair", "Fear"],
    "Undead Spirit": ["Ghostly", "Putrid", "Skeletal"],
    "Drake Companion": ["Acid", "Cold", "Fire", "Lightning", "Poison"],
    "Draconic Spirit": ["Chromatic", "Gem", "Metallic"],
  };

  async #buildCompanion(block, options = {}) {
    console.warn("factoryblock", block);
    logger.debug("Beginning companion parse", { block });
    const ddbCompanion = new DDBCompanion(block, options);
    // eslint-disable-next-line no-await-in-loop
    await ddbCompanion.parse();
    if (ddbCompanion.parsed) this.companions.push(ddbCompanion.data);
  }

  async parse() {
    console.warn(this.doc);

    const statBlockDivs = this.doc.querySelectorAll("div.stat-block-background, div.stat-block-finder");

    console.warn("statblkc divs", { statBlockDivs, athis: this });
    for (const block of statBlockDivs) {
      const name = block
        .querySelector("p.Stat-Block-Styles_Stat-Block-Title")
        .innerText
        .trim()
        .toLowerCase()
        .split(" ")
        .map((w) => utils.capitalize(w))
        .join(" ");

      if (name && name in DDBCompanionFactory.MULTI) {
        for (const subType of DDBCompanionFactory.MULTI[name]) {
          // eslint-disable-next-line no-await-in-loop
          await this.#buildCompanion(block, { name, subType });
        }
      } else {
        // eslint-disable-next-line no-await-in-loop
        await this.#buildCompanion(block);
      }

    }

    return this.companions;
  }

}
