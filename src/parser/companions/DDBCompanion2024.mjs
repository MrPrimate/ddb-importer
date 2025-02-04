import DDBCompanionMixin from "./DDBCompanionMixin.mjs";

export default class DDBCompanion2024 extends DDBCompanionMixin {

  constructor(block, options = {}) {
    super(block, options);

    this.h4Tag = this.block.querySelector('h4');
    this.infoTag = null;

    // If the h4 tag is found, get the next sibling element
    if (this.h4Tag) {
      const nextSibling = this.h4Tag.nextElementSibling;

      // If the next sibling is a p tag, return its text content
      if (nextSibling.tagName === 'P') {
        this.infoTag = nextSibling;
      }
    }
  }

  #generateAbilities() {

    // foundry.utils.setProperty(this.npc, `system.abilities.${ability}.value`, value);
    // foundry.utils.setProperty(this.npc, `system.abilities.${ability}.mod`, mod);

    // Create a DOM parser to parse the HTML string

    // Find the table elements containing the ability scores
    const tables = this.block.querySelectorAll('tbody');

    // Initialize an object to store the ability scores
    const abilityScores = {};

    // Loop through each table
    tables.forEach((table) => {
      // Find the table rows
      const rows = table.querySelectorAll('tr');

      // Loop through each row
      rows.forEach((row) => {
        // Find the table cells
        const cells = row.querySelectorAll('th, td');

        // If the row has at least two cells, extract the ability score
        if (cells.length >= 2) {
          const ability = cells[0].textContent.trim().toLowerCase();
          const score = cells[1].textContent.trim();
          const mod = cells[2].textContent.trim().replace("&minus;", "-");
          const save = cells[2].textContent.trim().replace("&minus;", "-");

          // Store the ability score in the object
          abilityScores[ability] = {
            score,
            mod,
            save,
          };
        }
      });
    });

    for (const [ability, data] of Object.entries(abilityScores)) {
      const save = Number.parseInt(data.save.replace("−", "-"));
      const mod = Number.parseInt(data.mod.replace("−", "-"));
      const score = Number.parseInt(data.score);

      foundry.utils.setProperty(this.npc, `system.abilities.${ability}.value`, score);
      foundry.utils.setProperty(this.npc, `system.abilities.${ability}.mod`, mod);
      if (save > score) {
        this.npc.system.abilities[ability]['proficient'] = 1;
      }
    }
  }

  _extractValue(match) {
    const paragraphs = this.block.querySelectorAll('p');

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const strongTags = paragraph.querySelectorAll('strong');
      for (let j = 0; j < strongTags.length; j++) {
        const strongTag = strongTags[j];
        if (strongTag.textContent.trim() === match) {
          return paragraph.textContent.trim().replace(match, '').trim();
        }
      }
    }

    return null;
  }

  #generateArmorClass() {
    const acString = this._extractValue("AC");
    if (!acString) return;

    this._handleAc(acString);

  }

  #generateProficiencyBonus() {
    const crString = this._extractValue("CR");
    if (!crString) return;
    if (crString.includes("equals your Proficiency Bonus")) {
      this.summons.match.proficiency = true;
    }
  }

  #generateHitPoints() {
    const hpString = this._extractValue("HP");
    if (!hpString) return;
    this._handleHitPoints(hpString);
    this._handleHitDice(hpString);
  }

  #generateSkills() {
    const skillsString = this._extractValue("Skills");
    if (!skillsString) return;
    this._handleSkills(skillsString);
  }

  #generateSize() {
    if (this.infoTag) {
      const sizeString = this.infoTag.textContent.split(",")[0].trim();
      this._handleSize(sizeString);
    }
  }

  #generateType() {
    if (this.infoTag) {
      const first = this.infoTag.textContent.split(",")[0];
      const typeCheck = first.split(" ").pop().trim().toLowerCase();
      this._handleType(typeCheck);
    }
  }

  #generateAlignment() {
    if (this.infoTag) {
      const alignment = this.infoTag.textContent.split(",").pop();
      this._handleAlignment(alignment);
    }
  }

  // Damage Resistances acid (Water only); lightning and thunder (Air only); piercing and slashing (Earth only)
  // Damage Immunities poison; fire (Fire only)
  // Damage Immunities necrotic, poison
  // Condition Immunities exhaustion, frightened, paralyzed, poisoned
  #generateImmunities() {
    const immunitiesString = this._extractValue("Immunities");
    if (!immunitiesString) return;

    const values = immunitiesString.replaceAll(";", ",").split(",");

    const damageTypes = [];
    const conditions = [];
    const types = Object.keys(CONFIG.DND5E.damageTypes);

    for (const value of values) {
      if (types.includes(value.split("(")[0].trim())) damageTypes.push(value.trim());
      else conditions.push(value.trim());
    }

    this._handleConditions(conditions.join(","));
    this._handleDamageImmunities(damageTypes.join(","));

  }

  #generateResistances() {
    const damageResistancesString = this._extractValue("Resistances");
    if (!damageResistancesString) return;
    this._handleDamageResistances(damageResistancesString);
  }

  #generateVulnerabilities() {
    const damagesString = this._extractValue("Vulnerabilities");
    if (!damagesString) return;

    this._handleDamageVulnerabilities(damagesString);
  }

  #generateSenses() {
    const senseString = this._extractValue("Senses");
    if (!senseString) return;

    this._handleSenses(senseString);
  }

  #generateLanguages() {
    const languageString = this._extractValue("Languages");
    if (!languageString) return;

    this._handleLanguages(languageString);
  }

  #generateSpeed() {
    const speedString = this._extractValue("Speed");
    if (!speedString) return;

    this._handleSpeed(speedString);
  }

  static _getActionType(featType) {
    switch (featType.toLowerCase().trim()) {
      case "special":
      case "trait":
      case "traits":
        return "special";
      case "action":
      case "actions":
        return "action";
      case "reactions":
      case "reaction":
        return "reaction";
      case "bonus":
      case "bonus actions":
        return "bonus";
      // no default
    }
    return "special";
  }

  async #generateFeatures() {
    for (const header of this.block.querySelectorAll('.monster-header')) {
      let now = header.nextElementSibling;
      let featType = DDBCompanion2024._getActionType(header.innerText);
      while (now !== null) {
        await this._processFeatureElement(now, featType);
        if (now.nextElementSibling === null || now.nextElementSibling.classList.contains('monster-header')) {
          now = null;
        } else {
          now = now.nextElementSibling;
        }
      }
    };
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
    this.#generateArmorClass();
    this.#generateProficiencyBonus();
    this.#generateHitPoints();
    this.#generateSkills();
    this.#generateImmunities();
    this.#generateResistances();
    this.#generateVulnerabilities();
    this.#generateAlignment();
    this.#generateSenses();
    this.#generateLanguages();
    this.#generateSpeed();
    await this.#generateFeatures();

    // console.warn("Result", this);
  }

}
