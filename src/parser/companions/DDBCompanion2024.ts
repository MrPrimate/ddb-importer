import { logger } from "../../lib/_module";
import DDBCompanionMixin from "./DDBCompanionMixin";

export default class DDBCompanion2024 extends DDBCompanionMixin {

  headerTag: HTMLElement | null;
  infoTag: HTMLElement | null;

  constructor(block: HTMLElement, options: IDDBCompanionMixinOptions = {}) {
    super(block, options);

    // the title is usually an h4; newer blocks (Vestige Companion) use an h3
    this.headerTag = this.block.querySelector("h3, h4, h5");
    this.infoTag = null;

    // If the h4 tag is found, get the next sibling element
    if (this.headerTag) {
      const nextSibling = this.headerTag.nextElementSibling as HTMLElement | null;

      // If the next sibling is a p tag, return its text content
      if (nextSibling && nextSibling.tagName === "P") {
        this.infoTag = nextSibling;
      }
    }
  }

  #generateAbilities() {

    // foundry.utils.setProperty(this.npc, `system.abilities.${ability}.value`, value);
    // foundry.utils.setProperty(this.npc, `system.abilities.${ability}.mod`, mod);

    // Create a DOM parser to parse the HTML string

    // Find the table elements containing the ability scores
    const tables = this.block.querySelectorAll("tbody");

    // Initialize an object to store the ability scores
    const abilityScores: Partial<Record<T5eAbility, { score: string; mod: string; save: string }>> = {};

    // Loop through each table
    tables.forEach((table) => {
      // Find the table rows
      const rows = table.querySelectorAll("tr");

      // Loop through each row
      rows.forEach((row) => {
        // Find the table cells
        const cells = row.querySelectorAll("th, td");

        // If the row has at least two cells, extract the ability score
        if (cells.length >= 2) {
          const ability = cells[0].textContent.trim().toLowerCase() as T5eAbility;
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

    const abilities = this.npc.system.abilities;
    if (!abilities) {
      logger.warn(`Companion ${this.npc.name} has no abilities data, unable to parse abilities`);
      return;
    }

    for (const [ability, data] of Object.entries(abilityScores) as [T5eAbility, typeof abilityScores[T5eAbility]][]) {
      if (!data) continue;
      const save = Number.parseInt(data.save.replace("−", "-"));
      // const mod = Number.parseInt(data.mod.replace("−", "-"));
      const score = Number.parseInt(data.score);

      abilities[ability].value = score;
      // foundry.utils.setProperty(this.npc, `system.abilities.${ability}.mod`, mod);
      if (save > score) {
        abilities[ability]["proficient"] = 1;
      }
    }
  }

  /**
   * The text after a bold label, up to the next label on the same line: newer blocks print
   * "AC 13 + your Charisma modifier Initiative +2 (12)" as one paragraph.
   */
  _extractValue(match: string): string | null {
    for (const strongTag of this.block.querySelectorAll("p strong")) {
      if (strongTag.textContent.trim() !== match) continue;
      // a label may sit inside an <em>, so read on from its outermost wrapper
      let start: Node = strongTag;
      while (start.parentNode && start.parentNode.nodeName !== "P" && start.parentNode.childNodes.length === 1) {
        start = start.parentNode;
      }
      let text = "";
      for (let node = start.nextSibling; node; node = node.nextSibling) {
        if (node.nodeName === "STRONG" || (node as Element).querySelector?.("strong")) break;
        text += node.textContent ?? "";
      }
      return text.trim();
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
    // AU Semblance of Life spirit forms carry their pool under a "Temp HP" label
    const hpString = this._extractValue("HP") ?? this._extractValue("Temp HP");
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
      const info = this.infoTag.textContent;
      // "Small Celestial, Fiend, or Undead; Neutral": a form named for a listed type is that type
      const subType = this.options.subType?.toLowerCase();
      const formType = subType && subType in CONFIG.DND5E.creatureTypes
        && new RegExp(`\\b${subType}\\b`, "i").test(info)
        ? subType
        : null;
      const first = info.split(",")[0];
      const typeCheck = formType ?? first.split(" ").pop()?.trim().toLowerCase() ?? "";
      this._handleType(typeCheck);
    }
  }

  /**
   * The alignment ends the info line, after a comma ("Small Beast, Neutral"), a semicolon
   * ("Small Celestial, Fiend, or Undead; Neutral") or nothing ("... (Your Choice) Neutral"), and
   * may be the summoner's ("your Alignment").
   */
  #generateAlignment() {
    if (this.infoTag) {
      const match = this.infoTag.textContent.trim()
        .match(/\b((?:lawful|chaotic|neutral)(?: (?:good|evil|neutral))?|unaligned|(?:any|your) alignment)\s*$/i);
      if (match) this._handleAlignment(match[1]);
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
      if (types.includes(value.split("(")[0].trim().toLowerCase())) damageTypes.push(value.trim());
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

  #generateStatBlockOverrides() {
    this._addStatBlockOverrides({
      ac: this._extractValue("AC"),
      hp: this._extractValue("HP") ?? this._extractValue("Temp HP"),
      speed: this._extractValue("Speed"),
      tag: this.infoTag?.textContent ?? null,
      challenge: this._extractValue("CR"),
      vulnerabilities: this._extractValue("Vulnerabilities"),
      resistances: this._extractValue("Resistances"),
      immunities: this._extractValue("Immunities"),
    });
  }

  static _getActionType(featType: string): TDDBMonsterActionType {
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

  async _processFeatureElement(html: string, featType: TDDBMonsterActionType) {
    const subType = this.options.subType?.toLowerCase() ?? "";
    const features = await this.getFeature(html, featType);
    features.forEach((feature) => {
      if (this.removeSplitCreatureActions && feature.name.toLowerCase().includes("only")
        && feature.name.toLowerCase().includes(subType)
      ) {
        if (this.removeCreatureOnlyNames) feature.name = feature.name.split("only")[0].split("(")[0].trim();
        this.npc.items.push(feature);
      } else if (!this.removeSplitCreatureActions || !feature.name.toLowerCase().includes("only")) {
        this.npc.items.push(feature);
      }
      if (foundry.utils.getProperty(feature, "flags.ddbimporter.levelBonus")) {
        this.summons.bonuses.attackDamage = "@item.level";
        this.summons.bonuses.saveDamage = "@item.level";
      }
      if (foundry.utils.getProperty(feature, "flags.ddbimporter.profBonus")) {
        this.summons.bonuses.attackDamage = "@prof";
      }
      if (foundry.utils.getProperty(feature, "flags.ddbimporter.spellSave")) {
        this.summons.match.saves = true;
      }
    });
  }

  async #generateFeatures() {
    for (const header of this.block.querySelectorAll(".monster-header")) {
      let now = header.nextElementSibling as HTMLElement | null;
      if (!now) continue;
      // jsdom (the audit harness) has no innerText
      const featType = DDBCompanion2024._getActionType((header as HTMLElement).innerText ?? header.textContent ?? "");
      let block = now.outerHTML;
      while (now !== null) {
        if (now.nextElementSibling === null || now.nextElementSibling.classList.contains("monster-header")) {
          now = null;
        } else {
          now = now.nextElementSibling as HTMLElement | null;
          block += `\r\n`;
          if (now) block += now.outerHTML;
        }
      }
      await this._processFeatureElement(block, featType);
    };
  }


  override async _generate() {
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
    this.#generateStatBlockOverrides();
    await this.#generateFeatures();
  }

}
