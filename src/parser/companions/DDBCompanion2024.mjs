/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */


import { DICTIONARY } from "../../config/_module.mjs";
import { logger } from "../../lib/_module.mjs";
import DDBCompanionMixin from "./DDBCompanionMixin.mjs";

export default class DDBCompanion2024 extends DDBCompanionMixin {

  constructor(block, options = {}) {
    super(block, options);
    this.blockDatas = this.block.querySelectorAll("p.Stat-Block-Styles_Stat-Block-Data");
  }


  getBlockData(type) {
    const block = Array.from(this.blockDatas).find((el) => {
      const elementName = el.innerText.trim();
      const elementStartsWith = elementName.startsWith(type);
      const isOnly = elementName.toLowerCase().includes("only")
        ? elementName.toLowerCase().includes(this.options.subType.toLowerCase())
        : true;
      return elementStartsWith && isOnly;
    });
    if (!block) return undefined;

    const header = block.getElementsByTagName("strong")[0].innerText.toLowerCase();
    if (header.includes("only") && !header.includes(this.options.subType.toLowerCase())) {
      return undefined;
    }

    const clone = block.cloneNode(true);
    clone.getElementsByTagName("strong")[0].innerHTML = "";
    return clone.innerText.trim();
  }

  #generateAbilities() {
  }

  #generateSavingThrows() {

  }

  #generateArmorClass() {

  }

  #generateProficiencyBonus() {

  }


  #getBaseHitPoints(hpString) {

  }

  #generateHitPoints() {

  }

  #generateHitDie() {

  }

  #generateSkills() {
  }

  #generateSize() {

  }

  #generateType() {

  }

  #generateAlignment() {

  }

  // Damage Resistances acid (Water only); lightning and thunder (Air only); piercing and slashing (Earth only)
  // Damage Immunities poison; fire (Fire only)
  // Damage Immunities necrotic, poison
  // Condition Immunities exhaustion, frightened, paralyzed, poisoned
  #generateImmunities() {

  }

  #generateResistances() {

  }

  #generateVulnerabilities() {

  }

  // Condition Immunities exhaustion, frightened, paralyzed, poisoned
  #generateConditions() {

  }

  #generateSenses() {

  }

  #generateLanguages() {

  }

  #generateSpeed() {

  }

  async #generateFeatures() {

  }

  // #extraFeatures() {
  // if (this.name === "Drake Companion") {
  //   this.npc.flags["arbron-summoner"].config.actorChanges.push(
  //     {
  //       "key": "system.traits.size",
  //       "value": `@classes.ranger.levels > 6 ? "med" : "${sizeData.value}"`,
  //     },
  //     {
  //       "key": "prototypeToken.width",
  //       "value": `@classes.ranger.levels > 6 ? 1 : ${this.npc.prototypeToken.width}`,
  //     },
  //     {
  //       "key": "prototypeToken.height",
  //       "value": `@classes.ranger.levels > 6 ? 1 : ${this.npc.prototypeToken.height}`,
  //     },
  //     {
  //       "key": "prototypeToken.scale",
  //       "value": `@classes.ranger.levels > 6 ? 1 : ${this.npc.prototypeToken.scale}`,
  //     },
  //   );
  // }
  // }

  async _generate() {
    this.#generateSize();
    this.#generateType();
    this.#generateAbilities();
    this.#generateSavingThrows();
    this.#generateArmorClass();
    this.#generateProficiencyBonus();
    this.#generateHitPoints();
    this.#generateHitDie();
    this.#generateSkills();
    this.#generateImmunities();
    this.#generateResistances();
    this.#generateVulnerabilities();
    this.#generateConditions();
    this.#generateAlignment();
    this.#generateSenses();
    this.#generateLanguages();
    this.#generateSpeed();
    await this.#generateFeatures();
  }

}
