import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import { newNPC } from "../monster/templates/monster.js";

export default class DDBCompanion {

  constructor(block, options = {}) {
    console.warn("DDBCompanion", { block });
    this.options = options;
    this.block = block;
    this.blockDatas = this.block.querySelectorAll("p.Stat-Block-Styles_Stat-Block-Data");
    this.npc = null;
    this.data = {};
    this.parsed = false;
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
    const block = Array.from(this.blockDatas).find((el) => el.innerText.trim().startsWith(type));
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

    const ac = Number.parseInt(acString.split(",")[0]);

    if (Number.isInteger(ac)) {
      this.npc.system.attributes.ac = {
        flat: ac,
        calc: "natural",
        formula: "",
      };

      if (acString.includes("plus PB") || acString.includes("+ PB")) {
        setProperty(this.npc, "flags.arbron-summoner.config.acFormula", `${ac} + @prof`);
      } else if (acString.includes("+ the level of the spell")) {
        setProperty(this.npc, "flags.arbron-summoner.config.acFormula", `${ac} + @details.level`);
      }
    }
  }

  #generateProficiencyBonus() {
    const profString = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Data-Last")
      ?? this.getBlockData("Challenge");

    if (profString && profString.innerText.includes("equals your bonus")) {
      setProperty(this.npc, "flags.arbron-summoner.config.matchProficiency", true);
    }
  }


  #getBaseHitPoints(hpString) {
    const baseString = this.options.subType && hpString.includes(" or ")
      ? hpString.split("or").find((s) => s.toLowerCase().includes(this.options.subType.toLowerCase()))
      : hpString.trim();

    const hpFind = baseString.trim().match(/(\d*)/);
    const hpInt = Number.parseInt(hpFind);
    return Number.isInteger(hpInt) ? hpInt : 0;
  }

  #generateHitPoints() {
    const hpString = this.getBlockData("Hit Points");
    if (!hpString) return;

    const hpInt = this.#getBaseHitPoints(hpString);
    this.npc.system.attributes.hp = hpInt;

    // conditions
    // 5 + five times your druid level
    // 5 + five times your ranger level (the beast has a number of Hit Dice [d8s] equal to your ranger level)
    // 1 + your Intelligence modifier + your artificer level (the homunculus has a number of Hit Dice [d4s] equal to your artificer level)
    // 40 + 15 for each spell level above 4th
    // 20 (Air only) or 30 (Land and Water only) + 5 for each spell level above 2nd
    // 50 (Demon only) or 40 (Devil only) or 60 (Yugoloth only) + 15 for each spell level above 6th
    // 30 (Ghostly and Putrid only) or 20 (Skeletal only) + 10 for each spell level above 3rd

    // additional summon points
    const hpAdjustments = [];
    const modMatch = hpString.match(/\+ your (\w+) modifier/);

    if (modMatch) hpAdjustments.push(`@abilities.${modMatch[1].toLowerCase().substring(0, 3)}.mod`);

    // class level
    const klassMultiMatch = hpString.match(/\+ (\w+)?( times? )?your (\w+) level/);
    if (klassMultiMatch) {
      const klass = klassMultiMatch[3].trim().toLowerCase();
      const multiplier = klassMultiMatch[1]
        ? DICTIONARY.numbers.find((d) => d.natural === klassMultiMatch[1].trim().toLowerCase()).num
        : null;
      const multiplierString = multiplier ? ` * ${multiplier}` : "";
      hpAdjustments.push(`(@classes.${klass}.levels${multiplierString})`);
    }

    // spell level
    const spellLevelMatch = hpString.match(/\+ (\d+) for each spell level above (\d)/);
    if (spellLevelMatch) {
      hpAdjustments.push(`(${spellLevelMatch[1]} * (@item.level - ${spellLevelMatch[2]}))`);
    }

    if (hpAdjustments.length > 0) {
      setProperty(this.npc, "flags.arbron-summoner.config.hpFormula", hpAdjustments.join(" + "));
    }

  }

  #generateHitDie() {
    // (the beast has a number of Hit Dice [d8s] equal to your ranger level)
    // (the homunculus has a number of Hit Dice [d4s] equal to your artificer level)
    const hpString = this.getBlockData("Hit Points");
    if (!hpString || !hpString.includes("number of Hit Dice")) return;

    const hitDice = hpString.match(/Hit Dice \[d(\d)s\] equal to your (\w+) level/);
    if (hitDice) {
      const hitDiceAdjustment = {
        "key": "system.attributes.hp.formula",
        "value": `(@classes.${hitDice[2]}.levels)[d${hitDice[1]}]`
      };
      this.npc.flags["arbron-summoner"].config.actorChanges.push(hitDiceAdjustment);
    }
  }

  #generateSkills() {
    const skillString = this.getBlockData("Skills");
    if (!skillString) return;
    //  "History + 12, Perception +0 plus PB &times; 2"
    const skillsMaps = skillString.split(",").filter((str) => str != '').map((str) => {
      const skillMatch = str.trim().match(/(\w+ *\w* *\w*)(?: *)([+-])(?: *)(\d+) *(plus PB)? *(&times;|x|times)? *(\d*)?/);
      let result = {};
      if (skillMatch) {
        result = {
          name: skillMatch[1].trim(),
          value: skillMatch[2] + skillMatch[3],
          proficient: skillMatch[4] !== undefined,
          expertise: Number.isInteger(skillMatch[5]?.trim()),
          pbMultiplier: skillMatch[5],
        };
        logger.debug(`Found skill for companion ${this.npc.name}`, result);
      } else {
        logger.error(`Skill Parsing failed for ${this.npc.name}`);
        logger.debug(skillString);
        logger.debug(str);
        logger.debug(skillMatch);
      }
      return result;
    });

    const keys = Object.keys(this.npc.system.skills);
    const validSkills = DICTIONARY.character.skills.map((skill) => skill.name);
    keys
      .filter((key) => validSkills.includes(key))
      .forEach((key) => {
        let skill = this.npc.system.skills[key];
        const lookupSkill = DICTIONARY.character.skills.find((s) => s.name == key);
        const skillData = skillsMaps.find((skl) => skl.name == lookupSkill.label);

        if (skillData) {
          skill.value = skillData.expertise ? 2 : skillData.proficient ? 1 : 0;
          const ability = this.npc.system.abilities[skill.ability];
          if (parseInt(ability.mod) !== parseInt(skillData.value.trim())) {
            skill.bonuses.check = parseInt(skillData.value.trim()) - parseInt(ability.mod);
            skill.bonuses.passive = parseInt(skillData.value.trim()) - parseInt(ability.mod);
          }

          this.npc.system.skills[key] = skill;
        }

      });
  }

  #generateSize() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Metadata").innerHTML;

    if (!data) return;
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
    if (!data) return;
    const typeName = data.split(",")[0].split(" ").pop().toLowerCase();

    if (CONFIG.DND5E.creatureTypes[typeName]) {
      this.npc.system.details.type.value = typeName;
    } else {
      this.npc.system.details.type.value = "Unknown";
    }
  }

  #generateAlignment() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Metadata").innerHTML;
    if (!data) return;
    const alignment = data.split(",").pop().toLowerCase().trim();

    if (alignment && alignment !== "") this.npc.system.details.alignment = alignment;
  }

  static getDamageAdjustments(data) {
    const values = [];
    const custom = [];
    const damageTypes = DICTIONARY.actions.damageType.filter((d) => d.name !== null).map((d) => d.name);

    data.forEach((adj) => {
      if (damageTypes.includes(adj.toLowerCase())) {
        values.push(adj.toLowerCase());
      } else if (adj.includes("physical")) {
        values.push("physical");
      } else {
        custom.push(adj);
      }
    });

    const adjustments = {
      value: values,
      custom: custom.join("; "),
    };

    return adjustments;
  }

  filterDamageConditions(data) {
    const onlyFiltered = data.split(/[;,]/).filter((state) => {
      if (state.includes("only")) {
        if (state.toLowerCase().includes(this.options.subType.toLowerCase())) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    });

    const conditions = [];

    onlyFiltered.forEach((state) => {
      const results = state
        .split("and")
        .map((s) => {
          return s.split("(")[0].trim().toLowerCase();
        });
      conditions.push(...results);
    });

    return conditions;
  }

  // Damage Resistances acid (Water only); lightning and thunder (Air only); piercing and slashing (Earth only)
  // Damage Immunities poison; fire (Fire only)
  // Damage Immunities necrotic, poison
  // Condition Immunities exhaustion, frightened, paralyzed, poisoned
  #generateImmunities() {
    const data = this.getBlockData("Damage Immunities");
    if (!data) return;

    this.npc.system.traits.di = DDBCompanion.getDamageAdjustments(this.filterDamageConditions(data));
  }

  #generateResistances() {
    const data = this.getBlockData("Damage Resistances");
    if (!data) return;

    this.npc.system.traits.dr = DDBCompanion.getDamageAdjustments(this.filterDamageConditions(data));
  }

  #generateVulnerabilities() {
    const data = this.getBlockData("Damage Vulnerabilities");
    if (!data) return;

    this.npc.system.traits.dv = DDBCompanion.getDamageAdjustments(this.filterDamageConditions(data));
  }

  // Condition Immunities exhaustion, frightened, paralyzed, poisoned
  #generateConditions() {
    const data = this.getBlockData("Condition Immunities");
    if (!data) return;

    let values = [];
    let custom = [];

    data.split(",").forEach((adj) => {
      const valueAdjustment = DICTIONARY.conditions.find((condition) => condition.label.toLowerCase() == adj.trim().toLowerCase());
      if (valueAdjustment) {
        values.push(valueAdjustment.foundry);
      } else {
        custom.push(adj);
      }
    });

    // Condition Immunities charmed, exhaustion, frightened, incapacitated, paralyzed, petrified, poisoned
    this.npc.system.traits.ci = {
      value: values,
      custom: custom.join("; "),
    };
  }

  #generateSenses() {
    const data = this.getBlockData("Senses");
    if (!data) return;

    // darkvision 60 ft., passive Perception 10 + (PB &times; 2)
    // darkvision 60 ft., passive Perception 10 + (PB × 2)

    data.split(",").forEach((sense) => {
      const match = sense.match(/(darkvision|blindsight|tremorsense|truesight)\s+(\d+)/i);

      if (match) {
        const value = parseInt(match[2]);
        this.npc.system.attributes.senses[match[1].toLowerCase()] = value;

        const senseType = DICTIONARY.senseMap[match[1].toLowerCase()];

        if (value > 0 && value > this.npc.prototypeToken.sight.range && hasProperty(CONFIG.Canvas.visionModes, senseType)) {
          setProperty(this.npc.prototypeToken.sight, "visionMode", senseType);
          setProperty(this.npc.prototypeToken.sight, "range", value);
          this.npc.prototypeToken.sight = mergeObject(this.npc.prototypeToken.sight, CONFIG.Canvas.visionModes[senseType].vision.defaults);
        }
        if (value > 0 && hasProperty(DICTIONARY.detectionMap, match[1].toLowerCase())) {
          const detectionMode = {
            id: DICTIONARY.detectionMap[match[1].toLowerCase()],
            range: value,
            enabled: true,
          };

          // only add duplicate modes if they don't exist
          if (!this.npc.prototypeToken.detectionModes.some((mode) => mode.id === detectionMode.id)) {
            this.npc.prototypeToken.detectionModes.push(detectionMode);
          }
        }
      }
    });
  }

  #generateLanguages() {
    const data = this.getBlockData("Languages");
    if (!data) return;

    // loop back to add small chance they have non-custom language support
    this.npc.system.traits.languages.custom = data;
  }

  #generateSpeed() {
    const data = this.getBlockData("Speed");
    if (!data) return;

    // 30 ft.; fly 40 ft. (hover) (Ghostly only)
    // 40 ft.; climb 40 ft. (Demon only); fly 60 ft. (Devil only)
    // 30 ft., fly 40 ft.

    const onlyFiltered = data.split(/[;,]/).filter((speed) => {
      if (speed.includes("only")) {
        if (speed.toLowerCase().includes(this.options.subType.toLowerCase())) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    });

    const speeds = [];
    onlyFiltered.forEach((state) => {
      const results = state
        .split("and")
        .map((s) => {
          return s.trim().toLowerCase();
        });
      speeds.push(...results);
    });

    speeds.forEach((speed) => {
      const match = speed.match(/(\w+ )*(\d+)/i);
      if (match) {
        const type = match[1]?.trim() ?? "walk";
        this.npc.system.attributes.movement[type] = parseInt(match[2]);
        if (speed.includes("hover")) this.npc.system.attributes.movement["hover"] = true;
      }
    });
  }


  async getFeature(text, type) {
    return {};

  }

  async #generateFeatures() {
    const data = this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Data-Last");
    if (!data) {
      logger.error(`Unable to parse ${this.npc.name} features and actions`, { this: this });
      return;
    }

    let end = false;
    let now = data.nextSibling;
    let featType = "feature";
    while (!end) {
      switch (end.innerText.trim().toLowerCase()) {
        case "action":
        case "actions":
          featType = "action";
          // eslint-disable-next-line no-continue
          continue;
        case "reaction":
        case "reactions":
          featType = "reaction";
          // eslint-disable-next-line no-continue
          continue;
        case "bonus actions":
        case "bonus":
        case "bonus action":
          featType = "bonus";
          // eslint-disable-next-line no-continue
          continue;
        // no default
      }

      // eslint-disable-next-line no-await-in-loop
      const feature = await this.getFeature(now, featType);
      this.npc.items.push(feature);

      now = now.nextSibling;
      if (!now) end = true;
    }
  }

  // this parser creates actor data for a base actor
  // these are actors that are modified by the PB of the actor
  // these require the use of "arbron-summoner" module to run.
  // {
  //   "config": {
  //     "matchProficiency": true,
  //     "matchToHit": true,
  //     "matchSaveDCs": true,
  //     "acFormula": "22 + @prof",
  //     "hpFormula": "2 + @prof",
  //     "actorChanges": [
  //       {
  //         "key": "system.attributes.movement.fly",
  //         "value": "10"
  //       }
  //     ]
  //   }

  async parse() {
    console.warn("PARSE COMPANION", { block: this.block, aThis: this });
    const name = this.options.name ?? this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Title").innerHTML;
    const namePostfix = this.options.subType
      ? `(${this.options.subType})`
      : "";

    if (!name) return;
    logger.debug(`Beginning companion parse for ${name}`, { name, block: this.block });

    const actorName = `${name} ${namePostfix}`.trim();
    this.npc = await newNPC(actorName);
    setProperty(this.npc, "flags.ddbimporter.companion.modifiers", {});
    this.npc.prototypeToken.name = actorName;

    setProperty(this.npc, "flags.arbron-summoner", {
      config: {
        matchProficiency: false,
        matchToHit: false,
        matchSaveDCs: false,
        acFormula: "",
        hpFormula: "",
        actorChanges: []
      }
    });

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

    this.data = duplicate(this.npc);
    this.parsed = true;

    logger.debug(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
    console.warn(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
  }

}
