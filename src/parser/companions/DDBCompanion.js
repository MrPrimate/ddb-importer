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
      const value = Number.parseInt(aNode.querySelector("span.stat-block-ability-scores-score").innerText);
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

      this.npc.system.abilities[ability]['value'] = value;
      this.npc.system.abilities[ability]['mod'] = mod;
    });
  }

  getBlockData(type) {
    const block = Array.from(this.blockDatas).find((el) => el.innerText.trim().startsWith(type));
    if (!block) return undefined;

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
    console.warn("hpString", hpString)
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
    const typeName = data.split(" ").pop().toLowerCase();

    if (CONFIG.DND5E.creatureTypes[typeName]) {
      this.npc.system.details.type.value = typeName;
    } else {
      this.npc.system.details.type.value = "Unknown";
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

    this.data = duplicate(this.npc);
    this.parsed = true;

    logger.debug(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
    console.warn(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
  }

}
