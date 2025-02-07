import { DICTIONARY } from "../../config/_module.mjs";
import { logger, DDBProxy, PatreonHelper, utils } from "../../lib/_module.mjs";
import DDBMonster from "../DDBMonster.js";
import DDBMonsterFactory from "../DDBMonsterFactory.js";
import DDBMonsterFeatureFactory from "../monster/features/DDBMonsterFeatureFactory.js";
import { newNPC } from "../monster/templates/monster.js";
import { DDBMonsterFeatureEnricher } from "../enrichers/_module.mjs";

export default class DDBCompanionMixin {

  constructor(block, options = {}, {
    addMonsterEffects = false, removeSplitCreatureActions = true, removeCreatureOnlyNames = true,
    addChrisPremades = true, useItemAC = false, legacyName = false,
  } = {}) {
    // console.warn("DDBCompanion", { block });
    this.options = options;
    this.block = block;
    this.npc = null;
    this.data = {};
    this.parsed = false;
    this.type = this.options.type;
    this.subType = this.options.subType;
    this.rules = this.options.rules;

    this.useItemAC = useItemAC; // game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");
    this.legacyName = legacyName; // game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    this.addMonsterEffects = addMonsterEffects; // game.settings.get("ddb-importer", "munching-policy-add-monster-midi-effects");
    this.removeSplitCreatureActions = removeSplitCreatureActions;
    this.removeCreatureOnlyNames = removeCreatureOnlyNames;
    this.addChrisPremades = addChrisPremades;

    this.summons = {
      match: {
        proficiency: false,
        attacks: false,
        saves: false,
      },
      creatureSizes: [],
      creatureTypes: [],
      bonuses: {
        ac: "",
        hp: "",
        attackDamage: "",
        saveDamage: "",
        healing: "",
      },
      profiles: [],
      summon: {
        identifier: "",
        mode: "", // cr for cr based cusooms
        prompt: true,
      },
    };
  }

  static async getEnrichedImageData(document) {
    const tiers = await PatreonHelper.checkPatreon();
    if (!tiers.all || DDBProxy.isCustom()) return null;
    const name = document.name;
    // this endpoint is not supported in custom proxies
    if (!CONFIG.DDBI.EXTRA_IMAGES) {
      const path = "/proxy/enriched/actor/images";
      const parsingApi = DDBProxy.getProxy();
      const response = await fetch(`${parsingApi}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const j = await response.json();
      if (!j.success) return null;
      foundry.utils.setProperty(CONFIG, "DDBI.EXTRA_IMAGES", j.data);
    }

    if (!foundry.utils.hasProperty(CONFIG, "DDBI.EXTRA_IMAGES.summons")) return null;
    const data = CONFIG.DDBI.EXTRA_IMAGES.summons[name]
      ?? CONFIG.DDBI.EXTRA_IMAGES.summons[name.split("(")[0].trim()];

    return data;
  }

  static async addEnrichedImageData(document) {
    const data = await DDBCompanionMixin.getEnrichedImageData(document);

    if (!data) return document;

    foundry.utils.setProperty(document, "flags.monsterMunch.enrichedImages", true);

    if (data.monsterIDs && data.monsterIDs.length > 0) {
      const monsterFactory = new DDBMonsterFactory({ type: "summons" });

      await monsterFactory.fetchDDBMonsterSourceData(DDBMonsterFactory.defaultFetchOptions(data.monsterIDs));

      for (const monsterSource of monsterFactory.source) {
        const img = monsterSource.basicAvatarUrl ?? monsterSource.largeAvatarUrl ?? monsterSource.avatarUrl;
        const tokenImg = monsterSource.avatarUrl;
        foundry.utils.setProperty(document, "flags.monsterMunch.tokenImg", tokenImg);
        foundry.utils.setProperty(document, "flags.monsterMunch.img", img);
        return document;
      }
    }
    if (data.actor) {
      foundry.utils.setProperty(document, "flags.monsterMunch.img", data.actor);
    }
    if (data.token) {
      foundry.utils.setProperty(document, "flags.monsterMunch.tokenImg", data.token);
    }

    // future enhancement loop through the downloaded compendium monsters for image
    return document;
  }

  static getDamageAdjustments(data) {
    const values = [];
    const custom = [];
    const bypasses = [];
    const damageTypes = DICTIONARY.actions.damageType.filter((d) => d.name !== null).map((d) => d.name);

    data.forEach((adj) => {
      if (damageTypes.includes(adj.toLowerCase())) {
        values.push(adj.toLowerCase());
      } else if (adj.includes("physical")) {
        values.push("bludgeoning", "piercing", "slashing");
        bypasses.push("mgc");
      } else {
        custom.push(adj);
      }
    });

    const adjustments = {
      value: values,
      bypasses,
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
          if (s.includes("determined by the")) {
            return this.options.subType.toLowerCase();
          } else {
            return s.split("(")[0].trim().toLowerCase();
          }
        });
      conditions.push(...results);
    });

    return conditions;
  }

  async getFeature(text, type) {
    const enricher = new DDBMonsterFeatureEnricher();
    await enricher.init();
    const options = {
      enricher: enricher,
      extra: true,
      useItemAC: this.useItemAC,
      legacyName: this.legacyName,
      addMonsterEffects: this.addMonsterEffects,
      addChrisPremades: this.addChrisPremades,
    };
    const ddbMonster = new DDBMonster(null, options);
    ddbMonster.name = this.name;
    ddbMonster.npc = foundry.utils.duplicate(this.npc);
    ddbMonster.abilities = ddbMonster.npc.system.abilities;
    ddbMonster.proficiencyBonus = 0;
    const featureFactory = new DDBMonsterFeatureFactory({
      ddbMonster,
      hideDescription: false,
      updateExisting: false,
    });
    await featureFactory.generateActions(text, type);
    logger.debug("Generating companion feature", { text, type, featureFactory });
    const toHitRegex = /(your spell attack modifier to hit|equals your spell attack modifier)/i;
    if (toHitRegex.test(text)) {
      this.summons.match.attacks = true;
    }
    const spellSaveRegex = /((against|equals) your spell save DC)/i;
    if (spellSaveRegex.test(text)) {
      this.summons.match.saves = true;
    }
    return featureFactory.getFeatures(type);
  }


  async _processFeatureElement(element, featType) {
    const features = await this.getFeature(element.outerHTML, featType);
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
      if (foundry.utils.getProperty(feature, "flags.ddbimporter.spellSave")) {
        this.summons.match.saves = true;
      }
    });
    return { element, featType };
  }

  async _processFeatureElements(element, featType) {
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

    const result = await this._processFeatureElement(next, featType);

    return result;
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

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _generate() {
    // this.#generateSize();
    // this.#generateType();
    // this.#generateAbilities();
    // this.#generateSavingThrows();
    // this.#generateArmorClass();
    // this.#generateProficiencyBonus();
    // this.#generateHitPoints();
    // this.#generateHitDie();
    // this.#generateSkills();
    // this.#generateImmunities();
    // this.#generateResistances();
    // this.#generateVulnerabilities();
    // this.#generateConditions();
    // this.#generateAlignment();
    // this.#generateSenses();
    // this.#generateLanguages();
    // this.#generateSpeed();
    // await this.#generateFeatures();
  }

  async parse() {
    // console.warn("PARSE COMPANION", { block: this.block, aThis: this });
    const name = this.options.name ?? this.block.querySelector("p.Stat-Block-Styles_Stat-Block-Title").innerHTML;
    const namePostfix = this.options.subType
      ? `(${this.options.subType})`
      : "";

    if (!name) return;
    this.name = name;
    logger.debug(`Beginning companion parse for ${name}`, { name, block: this.block });

    const actorName = `${name} ${namePostfix}`.trim();
    this.npc = newNPC(actorName);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.companion.modifiers", {});
    this.npc.prototypeToken.name = actorName;

    const summonsKey = `companion-${utils.normalizeString(actorName)}-${this.rules}`;
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.changes", []);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.name", `${name}`);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.id", summonsKey);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.entityTypeId", `companion-${this.type}`);
    foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.summonsKey", summonsKey);
    if (this.options.folderHint) foundry.utils.setProperty(this.npc, "flags.ddbimporter.summons.folder", this.options.folderHint);

    foundry.utils.setProperty(this.npc, "system.source.rules", this.rules);
    await this._generate();

    // make friendly
    foundry.utils.setProperty(this.npc, "prototypeToken.disposition", 1);

    const data = await DDBCompanionMixin.addEnrichedImageData(foundry.utils.duplicate(this.npc));

    this.data = data;
    this.parsed = true;

    logger.debug(`Finished companion parse for ${name}`, { name, block: this.block, data: this.data, npc: this.npc });
  }

  _handleAc(acString) {
    const ac = Number.parseInt(acString.split(",")[0]);

    if (Number.isInteger(ac)) {
      this.npc.system.attributes.ac = {
        flat: ac,
        calc: "natural",
        formula: "",
      };

      const testString = utils.nameString(acString);
      if (testString.includes("plus PB") || acString.includes("+ PB")) {
        this.summons.bonuses.ac = "@prof";
      } else if (testString.includes("+ the level of the spell") || testString.includes("the spell's level")) {
        this.summons.bonuses.ac = "@item.level";
      }
    }
  }

  _getBaseHitPoints(hpString) {
    const hpPrepared = hpString.toLowerCase().replaceAll(", ", " or ");
    const subType = this.subType?.toLowerCase();
    const baseString = subType && hpString.includes(" or ") && hpPrepared.includes(subType)
      ? hpPrepared.split("or").find((s) => s.includes(subType))
      : hpPrepared.trim();

    const hpFind = baseString.trim().match(/(\d*)/);
    const hpInt = Number.parseInt(hpFind);
    return Number.isInteger(hpInt) ? hpInt : 0;
  }

  _handleHitPoints(hpString) {
    const hpInt = this._getBaseHitPoints(hpString);
    this.npc.system.attributes.hp.max = hpInt;
    this.npc.system.attributes.hp.value = hpInt;

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
      hpAdjustments.push(`@classes.${klass}.levels${multiplierString}`);
    }

    // spell level
    const spellLevelMatch = hpString.match(/\+ (\d+) for each spell level above (\d)/);
    if (spellLevelMatch) {
      hpAdjustments.push(`${spellLevelMatch[1]} * (@item.level - ${spellLevelMatch[2]})`);
    }

    if (hpAdjustments.length > 0) {
      this.summons.bonuses.hp = hpAdjustments.join(" + ");
    }
  }

  _handleHitDice(hpString) {
    // (the beast has a number of Hit Dice [d8s] equal to your ranger level)
    // (the homunculus has a number of Hit Dice [d4s] equal to your artificer level)
    if (!hpString || !hpString.includes("number of Hit Dice")) return;

    const hitDice = hpString.match(/Hit Dice \[d(\d)s\] equal to your (\w+) level/);
    if (hitDice) {
      const hitDiceAdjustment = {
        "key": "system.attributes.hp.formula",
        "value": `(@classes.${hitDice[2]}.levels)[d${hitDice[1]}]`,
      };
      this.npc.flags.ddbimporter.summons.changes.push(hitDiceAdjustment);
    }
  }

  _handleSize(sizeString) {
    const size = sizeString.split(" ")[0];
    const nameSize = this.subType
      ? DICTIONARY.sizes.find((s) => this.subType.toLowerCase() == s.name.toLowerCase())
      : null;
    const sizeData = DICTIONARY.sizes.find((s) => size.toLowerCase() == s.name.toLowerCase())
      ?? { name: "Medium", value: "med", size: 1 };

    const finalSize = nameSize ?? sizeData;

    this.npc.system.traits.size = finalSize.value;
    this.npc.prototypeToken.width = finalSize.size;
    this.npc.prototypeToken.height = finalSize.size;
    this.npc.prototypeToken.scale = 1;
  }

  _handleType(typeString) {
    if (CONFIG.DND5E.creatureTypes[typeString]) {
      this.npc.system.details.type.value = typeString;
    } else {
      this.npc.system.details.type.value = "Unknown";
    }
  }

  _handleAlignment(alignment) {
    if (alignment && alignment !== "") this.npc.system.details.alignment = alignment;
  }

  _handleSpeed(speedString) {
    // 30 ft.; fly 40 ft. (hover) (Ghostly only)
    // 40 ft.; climb 40 ft. (Demon only); fly 60 ft. (Devil only)
    // 30 ft., fly 40 ft.

    const onlyFiltered = speedString.split(/[;,]/).filter((speed) => {
      if (speed.toLowerCase().includes("only")) {
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

  _handleLanguages(languagesString) {
    // loop back to add small chance they have non-custom language support
    this.npc.system.traits.languages.custom = languagesString;
  }

  _handleSenses(sensesString) {
    // darkvision 60 ft., passive Perception 10 + (PB &times; 2)
    // darkvision 60 ft., passive Perception 10 + (PB × 2)

    sensesString.split(",").forEach((sense) => {
      const match = sense.match(/(darkvision|blindsight|tremorsense|truesight)\s+(\d+)/i);

      if (match) {
        const value = parseInt(match[2]);
        this.npc.system.attributes.senses["units"] = "ft";
        this.npc.system.attributes.senses[match[1].toLowerCase()] = value;

        const senseType = DICTIONARY.senseMap()[match[1].toLowerCase()];

        if (value > 0 && value > this.npc.prototypeToken.sight.range && foundry.utils.hasProperty(CONFIG.Canvas.visionModes, senseType)) {
          foundry.utils.setProperty(this.npc.prototypeToken.sight, "visionMode", senseType);
          foundry.utils.setProperty(this.npc.prototypeToken.sight, "range", value);
          this.npc.prototypeToken.sight = foundry.utils.mergeObject(this.npc.prototypeToken.sight, CONFIG.Canvas.visionModes[senseType].vision.defaults);
        }
        if (value > 0 && foundry.utils.hasProperty(DICTIONARY.detectionMap, match[1].toLowerCase())) {
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

  _handleConditions(conditionsString) {
    let values = [];
    let custom = [];

    conditionsString.split(",").forEach((adj) => {
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

  _handleDamageImmunities(damageImmunitiesString) {
    const filtered = this.filterDamageConditions(damageImmunitiesString);
    this.npc.system.traits.di = DDBCompanionMixin.getDamageAdjustments(filtered);
  }

  _handleDamageResistances(damageResistancesString) {
    const filtered = this.filterDamageConditions(damageResistancesString);
    this.npc.system.traits.dr = DDBCompanionMixin.getDamageAdjustments(filtered);
  }

  _handleDamageVulnerabilities(damageVulnerabilitiesString) {
    const filtered = this.filterDamageConditions(damageVulnerabilitiesString);
    this.npc.system.traits.dv = DDBCompanionMixin.getDamageAdjustments(filtered);
  }

  _handleSkills(skillsString) {

    //  "History + 12, Perception +0 plus PB &times; 2"
    const skillsMaps = skillsString.split(",").filter((str) => str != '').map((str) => {
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
        logger.debug(skillsString);
        logger.debug(str);
        logger.debug(skillMatch);
      }
      return result;
    });

    const keys = Object.keys(this.npc.system.skills);
    const validSkills = DICTIONARY.actor.skills.map((skill) => skill.name);
    keys
      .filter((key) => validSkills.includes(key))
      .forEach((key) => {
        let skill = this.npc.system.skills[key];
        const lookupSkill = DICTIONARY.actor.skills.find((s) => s.name == key);
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

}
