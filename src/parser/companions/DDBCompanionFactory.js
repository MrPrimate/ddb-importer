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

  async parse() {
    console.warn(this.doc);

    const statBlockDivs = this.doc.querySelectorAll("div.stat-block-background");

    console.warn("statblkc divs", { statBlockDivs, athis: this });
    for (const block of statBlockDivs) {
      console.warn("factoryblock", block);
      logger.debug("Beginning companion parse", { block });
      const ddbCompanion = new DDBCompanion(block, {});
      // eslint-disable-next-line no-await-in-loop
      await ddbCompanion.parse();
      if (ddbCompanion.parsed) this.companions.push(ddbCompanion.data);
    }

    return this.companions;
  }

}
