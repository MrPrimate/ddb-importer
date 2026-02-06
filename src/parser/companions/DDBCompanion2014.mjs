import { logger } from "../../lib/_module.mjs";
import DDBCompanionMixin from "./DDBCompanionMixin.mjs";

export default class DDBCompanion2014 extends DDBCompanionMixin {

  constructor(block, options = {}) {
    super(block, options);
    this.blockDatas = this.block.querySelectorAll("p.Stat-Block-Styles_Stat-Block-Data");
  }

  #generateAbilities() {
    const abilityNodes = this.block.querySelector("div.stat-block-ability-scores");

    abilityNodes.querySelectorAll("div.stat-block-ability-scores-stat").forEach((aNode) => {
      const ability = aNode.querySelector("div.stat-block-ability-scores-heading").innerText.toLowerCase();

      const getFallbackAbility = () => {
        const clone = aNode.querySelector("div.stat-block-ability-scores-data").cloneNode(true);
        clone.getElementsByTagName("span")[0].innerHTML = "";
        return clone.innerText.trim();
      };

      const abilityScore = aNode.querySelector("span.stat-block-ability-scores-score")?.innerText
        ?? getFallbackAbility();

      const value = Number.parseInt(abilityScore);
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

      this.npc.system.abilities[ability]['value'] = value;
      this.npc.system.abilities[ability]['mod'] = mod;
    });
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

  // savings throws
  #generateSavingThrows() {
    const saveString = this.getBlockData("Saving Throws");
    if (!saveString) return;

    const saves = saveString.split(",");

    saves.forEach((save) => {
      const ability = save.trim().split(" ")[0].toLowerCase();
      if (save.includes("plus PB") || save.includes("+ PB")) {
        this.npc.system.abilities[ability]['proficient'] = 1;
      }
    });
  }

  #generateArmorClass() {
    const acString = this.getBlockData("Armor Class");
    if (!acString) return;

    this._handleAc(acString);
  }

  #generateProficiencyBonus() {
    const profString = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Data-Last")
      ?? this.getBlockData("Challenge");

    if (profString && profString.innerText.includes("equals your bonus")) {
      this.summons.match.proficiency = true;
    }
  }

  #generateHitPoints() {
    const hpString = this.getBlockData("Hit Points");
    if (!hpString) return;
    this._handleHitPoints(hpString);
  }

  #generateHitDie() {
    // (the beast has a number of Hit Dice [d8s] equal to your ranger level)
    // (the homunculus has a number of Hit Dice [d4s] equal to your artificer level)
    const hpString = this.getBlockData("Hit Points");
    if (!hpString || !hpString.includes("number of Hit Dice")) return;

    this._handleHitDice(hpString);
  }

  #generateSkills() {
    const skillString = this.getBlockData("Skills");
    if (!skillString) return;
    this._handleSkills(skillString);
  }

  #generateSize() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Metadata").innerHTML;

    if (!data) return;
    this._handleSize(data);
  }

  #generateType() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Metadata").innerHTML;
    if (!data) return;
    const typeName = data.split(",")[0].split(" ").pop().toLowerCase();

    this._handleType(typeName);
  }

  #generateAlignment() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Metadata").innerHTML;
    if (!data) return;
    const alignment = data.split(",").pop().toLowerCase().trim();

    this._handleAlignment(alignment);
  }

  // Damage Resistances acid (Water only); lightning and thunder (Air only); piercing and slashing (Earth only)
  // Damage Immunities poison; fire (Fire only)
  // Damage Immunities necrotic, poison
  // Condition Immunities exhaustion, frightened, paralyzed, poisoned
  #generateImmunities() {
    const data = this.getBlockData("Damage Immunities");
    if (!data) return;

    this._handleDamageImmunities(data);
  }

  #generateResistances() {
    const data = this.getBlockData("Damage Resistances");
    if (!data) return;

    this._handleDamageResistances(data);
  }

  #generateVulnerabilities() {
    const data = this.getBlockData("Damage Vulnerabilities");
    if (!data) return;

    this._handleDamageVulnerabilities(data);
  }

  // Condition Immunities exhaustion, frightened, paralyzed, poisoned
  #generateConditions() {
    const data = this.getBlockData("Condition Immunities");
    if (!data) return;

    this._handleConditions(data);
  }

  #generateSenses() {
    const data = this.getBlockData("Senses");
    if (!data) return;

    this._handleSenses(data);
  }

  #generateLanguages() {
    const data = this.getBlockData("Languages");
    if (!data) return;

    this._handleLanguages(data);
  }

  #generateSpeed() {
    const data = this.getBlockData("Speed");
    if (!data) return;

    this._handleSpeed(data);
  }

  async _processFeatureElement(element, featType) {
    let next = element.nextElementSibling;

    if (!next) return { next, featType };

    switch (next.innerText.trim().toLowerCase()) {
      case "action":
      case "actions":
        logger.debug("Companion parsing switching to actions");
        return { next, featType: "action" };
      case "reaction":
      case "reactions":
        logger.debug("Companion parsing switching to reactions");
        return { next, featType: "reaction" };
      case "bonus actions":
      case "bonus":
      case "bonus action":
        logger.debug("Companion parsing switching to bonus actions");
        return { next, featType: "bonus" };
      // no default
    }

    const features = await this.getFeature(next.outerHTML, featType);
    features.forEach((feature) => {
      if (this.removeSplitCreatureActions && feature.name.toLowerCase().includes("only")
        && feature.name.toLowerCase().includes(this.options.subType.toLowerCase())
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
    });
    return { next, featType };
  }

  async #generateFeatures() {

    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Data-Last");
    if (!data) {
      logger.error(`Unable to parse ${this.npc.name} features and actions`, { this: this });
      return;
    }

    let now = data;
    let featType = "special";
    while (now !== null) {
      const result = await this._processFeatureElement(now, featType);
      now = result.next;
      featType = result.featType;
    }
  }


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
