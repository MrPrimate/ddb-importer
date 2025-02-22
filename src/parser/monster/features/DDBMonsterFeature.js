import { utils, logger, CompendiumHelper } from "../../../lib/_module.mjs";
import { DICTIONARY, SETTINGS } from "../../../config/_module.mjs";
import { DDBMonsterFeatureActivity } from "../../activities/_module.mjs";
import { DDBMonsterFeatureEnricher, mixins, Effects } from "../../enrichers/_module.mjs";
import { DDBTable, DDBReferenceLinker, DDBDescriptions, SystemHelpers } from "../../lib/_module.mjs";
import { DDBMonsterDamage } from "./DDBMonsterDamage.js";

export default class DDBMonsterFeature extends mixins.DDBActivityFactoryMixin {

  #generateAdjustedName() {
    this.originalName = `${this.name}`;
    if (!this.stripName) return;
    const regex = /(.*)\s*\((:?costs? \d actions|Recharges after a (Short or Long|Long) Rest|(?!Spell;|Psionics;).*\d\/day|recharge \d ?- ?\d|Recharge \d)\)/i;
    const nameMatch = this.name.replace(/[–-–−]/g, "-").match(regex);
    if (nameMatch) {
      this.data.name = nameMatch[1].trim();
      this.nameSplit = nameMatch[2];
    } else {
      const regex2 = /(.*)\s*\((.*); (:?costs \d actions|Recharges after a (Short or Long|Long) Rest|(?!Spell;|Psionics;).*\d\/day|recharge \d-\d|Recharge \d)\)/i;
      const nameMatch2 = this.name.replace(/[–-–−]/g, "-").match(regex2);
      if (nameMatch2) {
        this.data.name = `${nameMatch2[1].trim()} (${nameMatch2[2].trim()})`;
        this.nameSplit = nameMatch2[3];
      }
    }
  }

  createBaseFeature() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: this.name,
      type: this.templateType,
      system: SystemHelpers.getTemplate(this.templateType),
      effects: [],
      flags: {
        ddbimporter: {
          levelBonus: false,
          spellSave: false,
          dndbeyond: {
          },
        },
        monsterMunch: {
          titleHTML: this.titleHTML,
          fullName: this.fullName,
          actionCopy: this.actionCopy,
          type: this.type,
          description: this.html,
        },
      },
    };
    // these templates not good
    this.data.system.requirements = "";
    this.data.sort = this.sort;
    this.levelBonus = false;
  }

  // prepare the html in this.html for a parse, runs some checks and pregen to calculate values
  prepare() {
    this.strippedHtml = utils.stripHtml(`${this.html}`).trim();

    const descriptionParse = DDBDescriptions.featureBasics({ text: this.strippedHtml });
    this.descriptionParse = descriptionParse;

    // set calc flags
    this.isAttack = descriptionParse.properties.isAttack;
    this.isSummonAttack = descriptionParse.properties.isSummonAttack;
    this.spellSave = descriptionParse.properties.spellSave;
    this.savingThrow = descriptionParse.properties.savingThrow;
    this.summonSave = descriptionParse.properties.summonSave;
    this.isSave = descriptionParse.properties.isSave;
    this.halfDamage = descriptionParse.properties.halfDamage;
    this.pbToAttack = descriptionParse.properties.pbToAttack;
    this.weaponAttack = descriptionParse.properties.weaponAttack;
    // warning - unclear how to parse these out for 2024 monsters
    // https://comicbook.com/gaming/news/dungeons-dragons-first-look-2025-monster-manual/
    this.spellAttack = descriptionParse.properties.spellAttack;
    this.meleeAttack = descriptionParse.properties.meleeAttack;
    this.rangedAttack = descriptionParse.properties.rangedAttack;
    this.healingAction = descriptionParse.properties.healingAction;
    this.toHit = descriptionParse.properties.toHit;
    this.yourSpellAttackModToHit = descriptionParse.properties.yourSpellAttackModToHit;
    this.descriptionSave = descriptionParse.save;

    this.isRecharge = this.#matchRecharge();
    this.templateType = this.isAttack && this.isRecharge === null ? "weapon" : "feat";
    this.weaponLookup = DICTIONARY.monsters.weapons.find((weapon) => this.name.startsWith(weapon.name));

    if (this.name === "Legendary Actions" || !this.weaponLookup) {
      this.templateType = "feat";
    }

    if (!this.data) this.createBaseFeature();
    this.#generateAdjustedName();

    foundry.utils.setProperty(this.data, "flags.midiProperties", descriptionParse.midiProperties);

    this.identifier = utils.referenceNameString(this.data.name.toLowerCase());
    this.data.system.identifier = this.identifier;

    // if not attack set to a monster type action
    if (this.templateType !== "weapon") foundry.utils.setProperty(this.data, "system.type.value", "monster");

    this.isCompanion = foundry.utils.getProperty(this.ddbMonster, "npc.flags.ddbimporter.entityTypeId") === "companion-feature";

    if (this.summonSave) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.spellSave", true);
    }
    if (this.isSummonAttack) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.spellAttack", true);
    }


  }

  async loadEnricher() {
    await this.enricher.init();
    await this.enricher.load({
      ddbParser: this,
      monster: this.ddbMonster.npc,
      name: this.name,
    });
  }

  resetActionInfo() {
    this.actionInfo = {
      baseItem: null,
      baseTool: null,
      damage: {
        base: null,
        onSave: null,
        // parts: [],
        // versatile: "",
      },
      damageParts: [],
      healingParts: [],
      versatileParts: [],
      formula: "",
      target: {
        template: {
          count: "",
          contiguous: false,
          type: "", // line
          size: "", // 60
          width: "",
          height: "",
          units: "", // ft
        },
        affects: {
          count: "",
          type: "",
          choice: false,
          special: "",
        },
        prompt: true,
        override: false,
      },
      duration: {
        "value": "",
        "units": "inst",
      },
      extraAttackBonus: 0,
      baseAbility: null,
      proficient: false,
      properties: {
        "amm": false,
        "fin": false,
        "fir": false,
        "foc": false,
        "hvy": false,
        "lgt": false,
        "lod": false,
        "rch": false,
        "rel": false,
        "ret": false,
        "spc": false,
        "thr": false,
        "two": false,
        "ver": false,
        "mgc": false,
      },
      range: {
        value: null,
        long: null,
        units: "",
        reach: null,
      },
      activation: {
        type: "",
        value: null,
        condition: "",
      },
      save: {
        ability: [],
        dc: {
          calculation: "",
          formula: null,
        },
      },
      uses: {
        spent: null,
        max: null,
        recovery: [
          // { period: "", type: 'recoverAll', formula: undefined },
        ],
      },
      consumptionValue: null,
      consumptionTargets: [],
    };
  }

  constructor(name, { ddbMonster, html, type, titleHTML, fullName, actionCopy, updateExisting, hideDescription, sort } = {}) {

    const enricher = new DDBMonsterFeatureEnricher({ activityGenerator: DDBMonsterFeatureActivity });
    super({
      enricher,
      activityGenerator: DDBMonsterFeatureActivity,
      useMidiAutomations: ddbMonster.addMonsterEffects,
    });

    this.name = name.trim();
    this.ddbMonster = ddbMonster;
    this.is2014 = ddbMonster.is2014;
    this.is2024 = !this.is2014;
    this.useCastActivity = ddbMonster.useCastActivity;
    this.use2024Spells = ddbMonster.use2024Spells;

    this.type = type;
    this.html = html ?? "";
    this.titleHTML = titleHTML ?? undefined;
    this.fullName = fullName ?? this.name;
    this.actionCopy = actionCopy ?? false;
    this.sort = sort ?? null;

    this.hideDescription = hideDescription ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description");
    this.updateExisting = updateExisting ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
    this.stripName = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-strip-name");

    this.prepare();

    // copy source details from parent
    if (this.ddbMonster?.npc?.system.details?.source)
      this.data.system.source = this.ddbMonster.npc.system.details.source;

    this.actionInfo = {};
    this.resetActionInfo();

  }

  damageModReplace(text) {
    let result;
    const diceParse = utils.parseDiceString(text, null);
    if (this.actionInfo.baseAbility) {
      const baseAbilityMod = this.ddbMonster.abilities[this.actionInfo.baseAbility].mod;
      const bonusMod = (diceParse.bonus && diceParse.bonus !== 0) ? diceParse.bonus - baseAbilityMod : "";
      const useMod = (diceParse.bonus && diceParse.bonus !== 0) ? " + @mod " : "";
      const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, bonusMod, useMod);
      result = reParse.diceString;
    } else {
      result = diceParse.diceString;
    }

    return result;
  }

  _generateEscapeCheck(hit) {
    const escape = hit.match(/escape DC ([0-9]+)/);
    if (escape) {
      this.additionalActivities.push({
        type: "check",
        name: `Escape Check`,
        options: {
          generateCheck: true,
          generateTargets: false,
          generateRange: false,
          checkOverride: {
            "associated": [
              "acr",
              "ath",
            ],
            "ability": "",
            "dc": {
              "calculation": "",
              "formula": escape[1],
            },
          },
        },
      });
    }
  }

  generateDamageInfo() {
    const hitIndex = this.strippedHtml.indexOf("Hit:");
    let hit = (hitIndex > 0)
      ? `${this.strippedHtml.slice(hitIndex)}`.trim()
      : `${this.strippedHtml}`.replace(this.fullName, "").trim();
    hit = hit.replace(/[–-–−]/g, "-");

    this.ddbMonsterDamage = new DDBMonsterDamage(hit, { ddbMonsterFeature: this });

    this.ddbMonsterDamage.generateDamage();
    this.ddbMonsterDamage.generateRegain();

    this.actionInfo.damageParts.push(...this.ddbMonsterDamage.damageParts);
    this.actionInfo.versatileParts = this.ddbMonsterDamage.versatileParts;

    this._generateEscapeCheck(hit);

    if (this.actionInfo.damageParts.length > 0 && this.templateType === "weapon") {
      this.actionInfo.damage.base = this.actionInfo.damageParts[0].part;
    } else if (this.templateType !== "weapon" && this.actionInfo.versatileParts.length > 0) {
      this.additionalActivities.push({
        name: `Versatile`,
        options: {
          generateDamage: true,
          damageParts: this.actionInfo.versatileParts,
          includeBaseDamage: false,
        },
      });
    }
  }

  getActionType() {
    let action = this.type;
    const actionAction = this.strippedHtml.toLowerCase().match(/as (a|an) action/);
    const bonusAction = this.strippedHtml.toLowerCase().match(/as a bonus action/);
    const reAction = this.strippedHtml.toLowerCase().match(/as a reaction/);
    // e.g. mephit death
    const deathDie = this.strippedHtml.toLowerCase().match(/(creature|target|it) dies/);
    if (bonusAction) {
      action = "bonus";
    } else if (reAction) {
      action = "reaction";
    } else if (deathDie) {
      action = "special";
    } else if (actionAction) {
      action = "action";
    }
    if (this.type === "lair") action = "lair";
    else if (this.type === "mythic") action = "mythic";
    else if (this.type === "villain") action = "special";
    else if (this.type === "legendary") action = "legendary";
    return action;
  }


  #matchRecharge() {
    const matches = this.fullName.toLowerCase().match(/(?:\(|; )recharge ([0-9––−-]+)\)/);
    return matches;
  }

  #getRechargeRecovery() {
    const matches = this.isRecharge;
    if (!matches) return undefined;
    const value = matches[1].replace(/[––−-]/, "-").split("-").shift();
    return {
      period: "recharge",
      formula: value,
      type: "recoverAll",
    };
  }


  getUses(name = false) {
    let uses = {
      spent: null,
      max: null,
      recovery: [
        // { period: "", type: 'recoverAll', formula: undefined },
      ],
    };

    let recovery = {
      period: null,
      type: "recoverAll",
      formula: undefined,
    };

    const usesSearch = name ? /(\d+)\/(\w+)\)/ : /\((\d+)\/(\w+)\)/;
    const matchString = name
      ? this.titleHTML
        ? this.titleHTML
        : this.name
      : this.strippedHtml;
    const usesMatch = matchString.match(usesSearch);
    if (usesMatch && usesMatch[2].toLowerCase() !== "turn") {
      uses.spent = 0;
      uses.max = `${usesMatch[1]}`;
      recovery.period = "day";
      const perMatch = DICTIONARY.monsters.resets.find((reset) => reset.id === usesMatch[2]);
      if (perMatch) recovery.period = perMatch.value;
    } else {
      const shortLongRegex = (/Recharges after a (Short or Long|Long) Rest/i);
      const rechargeMatch = matchString.match(shortLongRegex);
      if (rechargeMatch) {
        recovery.period = rechargeMatch[1] === "Long" ? "lr" : "sr";
        uses.max = "1";
      }
    }

    if (recovery.period) {
      uses.recovery.push(recovery);
    }

    const recharge = this.#getRechargeRecovery();
    if (recharge) {
      uses.recovery.push(recharge);
      if (uses.max === null) uses.max = "1";
      uses.spent = 0;
      this.actionInfo.consumptionValue = "1";
    }

    // if (!name && uses.max === null && uses.recovery.length === 0) {
    //   return this.getUses(true);
    // }

    return uses;
  }

  getActivationValue() {
    const matches = this.strippedHtml.match(/\(costs ([0-9]+) actions\)/i);
    if (matches) return parseInt(matches[1]);
    const nameMatch = this.name.match(/\(costs ([0-9]+) actions\)/i);
    if (nameMatch) return parseInt(nameMatch[1]);
    return null;
  }

  getActivation() {
    const activation = foundry.utils.deepClone(this.actionInfo.activation);
    activation.value = this.getActivationValue();
    activation.type = this.getActionType();
    return activation;
  }

  getFeatSave() {
    this.actionInfo.save = this.descriptionSave;
    return this.actionInfo.save;
  }

  getReach() {
    const reachSearch = /reach\s*(\s*\d+\s*)\s*ft/;
    const match = this.strippedHtml.match(reachSearch);
    if (!match) return null;
    return match[1].trim();
  }

  getRange() {
    let range = {
      value: null,
      long: null,
      units: "",
      reach: this.getReach(),
    };

    const rangeSearch1 = /range\s*(\d+)\s*\/\s*(\d+)\s*ft/;
    const rangeSearch2 = /range\s*(\d+)\s*ft[.]*\s*\/\s*(\d+)\s*ft/;
    const rangeSearch3 = /range\s*(\d+)\s*(:?ft|feet)/;
    const reachSearch = /reach\s*(\d+)\s*(:?ft|feet)/;
    const withinSearch = /within\s*(\d+)\s*(:?ft|feet)/;

    const matches1 = this.strippedHtml.match(rangeSearch1);
    const matches2 = this.strippedHtml.match(rangeSearch2);
    const matches3 = this.strippedHtml.match(rangeSearch3);
    const reachMatch = this.strippedHtml.match(reachSearch);
    const withinMatch = this.strippedHtml.match(withinSearch);

    if (matches1) {
      range.value = parseInt(matches1[1]);
      range.long = parseInt(matches1[2]);
      range.units = "ft";
    } else if (matches2) {
      range.value = parseInt(matches2[1]);
      range.long = parseInt(matches2[2]);
      range.units = "ft";
    } else if (matches3) {
      range.value = parseInt(matches3[1]);
      range.units = "ft";
    } else if (reachMatch) {
      this.actionInfo.properties.rch = true;
      range.reach = parseInt(reachMatch[1]);
      range.units = "ft";
    } else if (withinMatch) {
      this.actionInfo.properties.rch = true;
      range.reach = parseInt(withinMatch[1]);
      range.units = "ft";
    }

    return range;
  }

  checkAbility(abilitiesToCheck) {
    let result = {
      success: false,
      ability: null,
      proficient: null,
    };

    for (const ability of abilitiesToCheck) {
      if (this.toHit == this.ddbMonster.proficiencyBonus + this.ddbMonster.abilities[ability].mod) {
        result.success = true;
        result.ability = ability;
        result.proficient = true;
        break;
      } else if (this.toHit == this.ddbMonster.abilities[ability].mod) {
        result.success = true;
        result.ability = ability;
        result.proficient = false;
        break;
      }
    }

    return result;
  }

  checkAbilities(abilitiesToCheck, negatives = false) {
    const results = abilitiesToCheck.map((ability) => {
      let result = {
        success: false,
        ability,
        proficient: null,
        bonus: 0,
      };
      if (this.toHit > this.ddbMonster.proficiencyBonus + this.ddbMonster.abilities[ability].mod) {
        result.success = true;
        result.proficient = true;
        result.bonus = this.toHit - this.ddbMonster.proficiencyBonus - this.ddbMonster.abilities[ability].mod;
      } else if (result.toHit > this.ddbMonster.abilities[ability].mod) {
        result.success = true;
        result.proficient = false;
        result.bonus = this.toHit - this.ddbMonster.abilities[ability].mod;
      } else if (negatives) {
        result.success = true;
        result.proficient = false;
        result.bonus = this.toHit - this.ddbMonster.abilities[ability].mod;
      }
      return result;
    });

    return results;
  }

  // eslint-disable-next-line complexity
  generateWeaponAttackInfo() {
    const abilities = ["str", "dex", "int", "wis", "cha", "con"];
    let initialAbilities = [];
    let weaponAbilities = ["str", "dex"];
    let spellAbilities = ["cha", "wis", "int"];

    // we have a weapon name match so we can infer a bit more
    if (this.weaponLookup) {
      for (const [key, value] of Object.entries(this.weaponLookup.properties)) {
        // logger.info(`${key}: ${value}`);
        this.actionInfo.properties[key] = value;
      }
      const versatileWeapon = this.actionInfo.properties.ver
        && this.ddbMonster.abilities['dex'].mod > this.ddbMonster.abilities['str'].mod;
      if (versatileWeapon || this.weaponLookup.actionType == "rwak") {
        weaponAbilities = ["dex"];
      } else if (this.weaponLookup.actionType == "mwak") {
        weaponAbilities = ["str"];
      }
      this.actionInfo.weaponType = this.weaponLookup.weaponType;
    } else if (this.meleeAttack) {
      this.actionInfo.weaponType = "simpleM";
    } else if (this.rangedAttack) {
      this.actionInfo.weaponType = "simpleR";
    }

    if (this.strippedHtml.includes("is a magic weapon attack")) {
      this.actionInfo.properties["mgc"] = true;
      foundry.utils.setProperty(this.data, "flags.midiProperties.magicdam", true);
    }

    if (this.spellAttack) {
      initialAbilities = spellAbilities;
    } else if (this.weaponAttack) {
      initialAbilities = weaponAbilities;
    } else {
      initialAbilities = abilities;
    }

    // force companions to null and proficient
    if (this.yourSpellAttackModToHit) {
      this.actionInfo.baseAbility = null;
      this.actionInfo.proficient = true;
    } else if (this.weaponAttack || this.spellAttack) {
      // check most likely initial attacks - str and dex based weapon, mental for spell
      const checkInitialAbilities = this.checkAbility(initialAbilities);
      if (checkInitialAbilities.success) {
        this.actionInfo.baseAbility = checkInitialAbilities.ability;
        this.actionInfo.proficient = checkInitialAbilities.proficient;
      }

      // okay lets see if its one of the others then!
      if (!this.actionInfo.baseAbility) {
        const checkAllAbilities = this.checkAbility(abilities);
        if (checkAllAbilities.success) {
          this.actionInfo.baseAbility = checkAllAbilities.ability;
          this.actionInfo.proficient = checkAllAbilities.proficient;
        }
      }

      // okay, some oddity, maybe magic bonus, lets calculate one!
      // we are going to assume it's dex or str based.
      if (!this.actionInfo.baseAbility) {
        const magicAbilities = this.checkAbilities(initialAbilities);

        const filteredAbilities = magicAbilities.filter((ab) => ab.success == true).sort((a, b) => {
          if (a.proficient == !b.proficient) return -1;
          if (b.proficient == !a.proficient) return 1;
          if (a.proficient == b.proficient) {
            if (a.bonus > b.bonus) return 1;
            if (b.bonus > a.bonus) return -1;
          }
          return 0;
        });

        // fine lets use the first hit
        if (filteredAbilities.length >= 1 && filteredAbilities[0].success) {
          this.actionInfo.baseAbility = filteredAbilities[0].ability;
          this.actionInfo.proficient = filteredAbilities[0].proficient;
          this.actionInfo.extraAttackBonus = filteredAbilities[0].bonus;
        }
      }

      // negative mods!
      if (!this.actionInfo.baseAbility) {
        logger.info(`Negative ability parse for ${this.ddbMonster.npc.name}, to hit ${this.toHit} with ${this.name}`);

        const magicAbilities = this.checkAbilities(initialAbilities, true);

        const filteredAbilities = magicAbilities.filter((ab) => ab.success == true).sort((a, b) => {
          if (a.proficient == !b.proficient) return -1;
          if (b.proficient == !a.proficient) return 1;
          if (a.proficient == b.proficient) {
            if (a.bonus < b.bonus) return 1;
            if (b.bonus < a.bonus) return -1;
          }
          return 0;
        });
        logger.debug("Filtered abilities", { filteredAbilities, html: this.strippedHtml });
        // fine lets use the first hit
        if (filteredAbilities.length >= 1 && filteredAbilities[0].success) {
          this.actionInfo.baseAbility = filteredAbilities[0].ability;
          this.actionInfo.proficient = filteredAbilities[0].proficient;
          this.actionInfo.extraAttackBonus = filteredAbilities[0].bonus;
        } else {
          logger.error("Unable to calculate attack!", { filteredAbilities, html: this.strippedHtml, ddbFeature: this });
        }
      }
    }
  }

  _targetsCreature() {
    const matchText = this.strippedHtml.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
    const creature = /You touch (?:a|one) (?:willing |living )?creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range|each creature within/gi;
    const creaturesRange = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /attack against the target|at a target in range/gi;
    return matchText.match(creature)
      || matchText.match(creaturesRange)
      || matchText.match(targets);
  }

  // eslint-disable-next-line complexity
  getTarget() {
    let target = {
      template: {
        count: "",
        contiguous: false,
        type: "", // line
        size: "", // 60
        width: "",
        height: "",
        units: "", // ft
      },
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      prompt: true,
      override: false,
    };

    // 90-foot line that is 10 feet wide
    // in a 90-foot cone
    const matchText = this.strippedHtml.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
    // console.warn(matchText);
    const lineSearch = /(\d+)-foot line|line that is (\d+) feet/i;
    const coneSearch = /(\d+)-foot cone/i;
    const cubeSearch = /(\d+)-foot cube/i;
    const sphereSearch = /(\d+)-foot-radius sphere/i;

    const coneMatch = matchText.match(coneSearch);
    const lineMatch = matchText.match(lineSearch);
    const cubeMatch = matchText.match(cubeSearch);
    const sphereMatch = matchText.match(sphereSearch);

    if (coneMatch) {
      target.template.size = coneMatch[1];
      target.template.units = "ft";
      target.template.type = "cone";
    } else if (lineMatch) {
      target.template.size = lineMatch[1] ?? lineMatch[2];
      target.template.units = "ft";
      target.template.type = "line";
    } else if (cubeMatch) {
      target.template.size = cubeMatch[1];
      target.template.units = "ft";
      target.template.type = "cube";
    } else if (sphereMatch) {
      target.template.size = sphereMatch[1];
      target.template.units = "ft";
      target.template.type = "sphere";
    } else {
      const aoeSizeRegex = /(?<!one creature you can see |an object you can see )(?:within|in a|fills a) (\d+)(?: |-)(?:feet|foot|ft|ft\.)(?: |-)(cone|radius|emanation|sphere|line|cube|of it|of an|of the|of you|of yourself)(\w+[. ])?/ig;

      // each creature that isn’t an Undead in a 20-foot Emanation originating from the lich.
      const aoeSizeMatch = aoeSizeRegex.exec(matchText);

      // console.warn(`Target generation for ${this.name}`, {
      //   aoeSizeMatch,
      // });

      if (aoeSizeMatch) {
        const type = aoeSizeMatch[3]?.trim() ?? aoeSizeMatch[2]?.trim() ?? "radius";
        target.template.type = ["cone", "radius", "sphere", "line", "cube"].includes(type) ? type : "radius";
        target.template.size = aoeSizeMatch[1] ?? "";
        target.template.units = "ft";
        if (aoeSizeMatch[2] && aoeSizeMatch[2].trim() === "of you") {
          this.actionInfo.range.units = "self";
        }
      }
    }

    if (target.template.type === "" && this.healingAction) {
      target.template.type = "self";
    }

    const targetsCreature = this._targetsCreature();
    const creatureTargetCount = (/(each|one|a|the) creature(?: or object)?/ig).exec(matchText);

    if (targetsCreature || creatureTargetCount) {
      target.affects.count = creatureTargetCount && ["one", "a", "the"].includes(creatureTargetCount[1]) ? "1" : "";
      target.affects.type = creatureTargetCount && creatureTargetCount[2] ? "creatureOrObject" : "creature";
    }

    return target;
  }

  #getHiddenDescription() {
    const nameChoice = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description-choice");
    const hideItemName = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-item-name");
    let actorDescriptor = `[[lookup @name]]`;

    if (nameChoice === "TYPE") {
      actorDescriptor = `[[lookup @details.type.config.label]]`;
    } else if (nameChoice === "MONSTER") {
      actorDescriptor = "Monster";
    } else if (nameChoice === "NPC") {
      actorDescriptor = "NPC";
    }

    let description = `<section class="secret">\n${this.html}`;
    if (this.activityType === "attack" && !this.spellAttack) {
      const featureName = hideItemName ? "" : ` with its [[lookup @item.name]]`;
      description += `\n</section>\nThe ${actorDescriptor} attacks${featureName}.`;
    } else if (this.spellAttack || this.spellSave) {
      const featureName = hideItemName ? "a spell" : "[[lookup @item.name]]";
      description += `\n</section>\nThe ${actorDescriptor} casts ${featureName}.`;
    } else if (this.activityType === "save") {
      const featureName = hideItemName ? "a feature" : "[[lookup @item.name]]";
      description += `\n</section>\nThe ${actorDescriptor} uses ${featureName} and a save is required.`;
    } else {
      description += `\n</section>\nThe ${actorDescriptor} uses ${hideItemName ? "a feature" : "[[lookup @item.name]]"}.`;
    }
    return description;
  }

  // eslint-disable-next-line complexity
  #processMultiAttack(description) {
    if (this.is2014) return description;

    const actionNames = new Set();
    const extractActions = ((str) => {
      return str
        .replace("many Bite", "Bite")
        .replace("if available", "")
        .replace("attacks. It can replace one attack with a ", ",")
        .replace(". It can replace one attack with a use of", ",")
        .replaceAll("and one with its", "")
        .replaceAll("one with its", "")
        .replace("attack and one ", ",")
        .replace("attack, one ", ",")
        .replace("attack, two ", ",")
        .replace("attack, and one ", ",")
        .replace("attacks, and one ", ",")
        .replace("attacks and one ", ",")
        .replace("attack and two ", ",")
        .replace("attacks or two ", ",")
        .replace("attack and three other ", ",")
        .replace("attack and three ", ",")
        .replace("attacks or four ", ",")
        .replace("attacks or five ", ",")
        .replaceAll(", or ", ",")
        .replaceAll(" or ", ",")
        .split(",")
        .map((s) => s.trim());
    });

    const handleReplaceNames = ((str) => {
      const replaceNames = extractActions(str);
      // console.warn("Replace names", replaceNames);
      for (const name of replaceNames) {
        const listNameRegex = /\(\w\) (.*)/i;
        const listNameMatch = listNameRegex.exec(name);
        // eslint-disable-next-line max-depth
        if (listNameMatch) {
          const listName = listNameMatch[1];
          // eslint-disable-next-line max-depth
          if (listName.includes("Spellcasting")) actionNames.add("Spellcasting");
          else actionNames.add(listName.split("(")[0].trim());
        } else if (name.includes("Spellcasting")) {
          actionNames.add("Spellcasting");
        } else {
          actionNames.add(name.trim());
        }
      }
    });

    const orMakesRegex = /The (?:.*) makes (\w+) (?<attackNames>.*) attack, or it makes (\w+) (?<replaceName>.*?) attacks/i;
    const orMakesMatch = orMakesRegex.exec(this.strippedHtml);

    const multRegex = /The (?:.*) makes (\w+) attacks, using (?<attackNames>.*:?)( in any combination(?:, and( it)? uses (?<attackNames2>.*)\.)?)/i;
    const multiMatch = multRegex.exec(this.strippedHtml);
    const basicMARegex = /The (?:.*) makes (\w+) (?<attackNames>.*:?) attacks?(?:(?: and uses|, and it can use) (?<attackNames2>.*))\./i;
    const basicMAMatch = basicMARegex.exec(this.strippedHtml);

    const simpleMARegex = /The (?:.*) makes (\w+) attacks: (?<attackNames>.*:?)\./i;
    const simpleMAMatch = simpleMARegex.exec(this.strippedHtml);

    const makesAttRegex = /The (?:.*) makes (\w+) (?<attackNames>.*?) attacks(, or it makes three (?<attackNames2>.*) attacks| and| as| or uses (?<attackNames3>.*?)(?:\.| (twice|three))|, using (?<attackNames4>.*?) in any combination|\.)/i;
    const makesAttMatch = makesAttRegex.exec(this.strippedHtml);

    const fallbackMakesOrRegex = /The (?:.*) makes (\w+) (?<attackNames>.*?) attack, and it uses (?<attackNames2>.*?)\./i;
    const fallbackMakesOrMatch = fallbackMakesOrRegex.exec(this.strippedHtml);

    const superFallbackRegex = /The (?:.*) makes (\w+) (?<attackNames>.*:?) attacks?/i;
    const superFallbackMatch = superFallbackRegex.exec(this.strippedHtml);

    const match = orMakesMatch
      ?? multiMatch
      ?? basicMAMatch
      ?? simpleMAMatch
      ?? makesAttMatch
      ?? fallbackMakesOrMatch
      ?? superFallbackMatch;

    if (match) {
      const attackNames = [];
      if (match.groups.attackNames) attackNames.push(match.groups.attackNames);
      if (match.groups.attackNames2) attackNames.push(match.groups.attackNames2);
      if (match.groups.attackNames3) attackNames.push(match.groups.attackNames3);
      if (match.groups.attackNames4) attackNames.push(match.groups.attackNames4);
      if (match.groups.replaceName) attackNames.push(match.groups.replaceName);
      for (const attackNameString of attackNames) {
        handleReplaceNames(attackNameString);
      }
    }

    const replaceRegex = /It can replace (?:\w+|the (?:\w+)) attacks? with a use of (?<replaceName>.*?)\./i;
    const replaceRegex2 = /It can replace (?:\w+|the (?:\w+)) attacks? with a (?<replaceName>.*?) attack\./i;
    const replaceMatch = replaceRegex.exec(this.strippedHtml) ?? replaceRegex2.exec(this.strippedHtml);
    if (replaceMatch) {
      handleReplaceNames(replaceMatch.groups.replaceName);
    }

    const andRegex = /The (?:.*) can use its (?<attackNames>.*) and makes/i;
    const andMatch = andRegex.exec(this.strippedHtml);
    if (andMatch) {
      handleReplaceNames(andMatch.groups.attackNames);
    }

    const andCanRegex = /(?:and can use|It also uses|and it uses|and it can use) (?<attackNames>.*)\./i;
    const andCanMatch = andCanRegex.exec(this.strippedHtml);
    if (andCanMatch) {
      handleReplaceNames(andCanMatch.groups.attackNames);
    }

    const ifItUsedRegex = /if it used (?<attackNames>.*) this turn/i;
    const ifItUsedMatch = ifItUsedRegex.exec(this.strippedHtml);
    if (ifItUsedMatch) {
      handleReplaceNames(ifItUsedMatch.groups.attackNames);
    }

    const usesRegex = /The (?:.*) uses (?<attackNames>.*?)(?:\.| twice| three| four| five)/i;
    const usesMatch = usesRegex.exec(this.strippedHtml);
    if (usesMatch) {
      handleReplaceNames(usesMatch.groups.attackNames);
    }

    if (CONFIG.debug.ddbimporter.multiattack) {
      if (actionNames.size === 0) {
        if (!CONFIG.DDBI.NO_MULTIATTACK) {
          CONFIG.DDBI.NO_MULTIATTACK = [];
          CONFIG.DDBI.NO_MULTIATTACK_DETAILS = [];
        }
        CONFIG.DDBI.NO_MULTIATTACK.push(this.strippedHtml);
        CONFIG.DDBI.NO_MULTIATTACK_DETAILS.push({ actionNames, name: this.ddbMonster.name, html: this.strippedHtml, match, is2014: this.is2014 });
      } else {
        if (!CONFIG.DDBI.NO_MULTIATTACK) {
          CONFIG.DDBI.MULTIATTACK_MATCHES = [];
          CONFIG.DDBI.MULTIATTACK_MATCHES_DETAILS = [];
        }
        CONFIG.DDBI.MULTIATTACK_MATCHES.push(actionNames);
        CONFIG.DDBI.MULTIATTACK_MATCHES_DETAILS.push({ actionNames, name: this.ddbMonster.name, html: this.strippedHtml, match, is2014: this.is2014 });

      }
    }


    // console.warn(`${this.ddbMonster.name}`,{
    //   orMakesMatch,
    //   basicMAMatch,
    //   multiMatch,
    //   simpleMAMatch,
    //   makesAttMatch,
    //   fallbackMakesOrMatch,
    //   match,
    //   strippedHtml: this.strippedHtml,
    //   is2014: this.is2014,
    //   this: this,
    //   actionNames,
    // });

    for (const actionName of actionNames) {
      description = description.replaceAll(actionName, `[[/item ${actionName}]]`);
    }
    return description;
  }

  async #generateDescription() {
    this.html = this.html.replace(/<strong> \.<\/strong>/, "").trim();
    let description = this.hideDescription ? this.#getHiddenDescription() : `${this.html}`;
    description = description.replaceAll("<em><strong></strong></em>", "");
    if (this.originalName === "Multiattack") {
      description = this.#processMultiAttack(description);
    }
    description = DDBReferenceLinker.parseDamageRolls({ text: description, document: this.data, actor: this.ddbMonster.npc });
    // description = parseToHitRoll({ text: description, document: this.feature });
    description = DDBReferenceLinker.parseTags(description);
    this.data.system.description.value = await DDBTable.generateTable({
      parentName: this.ddbMonster.npc.name,
      html: description,
      updateExisting: this.updateExisting,
      notifier: this.notifier,
    });
    this.data.system.description.value = `<div class="ddb">
${this.data.system.description.value}
</div>`;


  }

  #buildAction() {
    if (Number.isInteger(parseInt(this.actionInfo.activation.value))) {
      this.actionInfo.consumptionValue = this.actionInfo.activation.value;
    } else {
      this.actionInfo.activation.value = 1;
    }

    if (this.templateType === "weapon") {
      this.data.system.damage = this.actionInfo.damage;
    }

    this.data.system.proficient = this.actionInfo.proficient;

    if (this.templateType === "weapon" && (this.weaponAttack || this.spellAttack)) {
      this.data.system.equipped = true;
    }

    if (this.weaponAttack && this.templateType === "weapon") {
      this.data.system.type.value = this.actionInfo.weaponType;
    } else if (this.spellAttack) {
      // if (!this.meleeAttack && !this.rangedAttack) {
      //   this.activityType = "save";
      // }
      // if (this.templateType === "feat") {
      //   this.data.system.equipped = true;
      // }
      foundry.utils.setProperty(this.data, "flags.midiProperties.magicdam", true);
      foundry.utils.setProperty(this.data, "flags.midiProperties.magiceffect", true);
      this.actionInfo.properties.mgc = true;
    }

    if (this.templateType === "weapon") {
      this.data.system.damage = this.actionInfo.damage;
      this.data.system.range = this.actionInfo.range;
    }
    this.data.system.uses = this.actionInfo.uses;

    for (const [key, value] of Object.entries(this.actionInfo.properties)) {
      if (value) this.data.system.properties.push(key);
    }

    if (this.name.includes("/Day") || this.name.includes("Recharges")) {
      this.data.system.uses = this.getUses(true);
    }

    return this.data;
  }

  #buildLair() {
    this.actionInfo.activation.type = "lair";
    if (this.data.name.trim() === "Lair Actions") {
      this.actionInfo.activation.value = 1;
    } else if (this.data.name.trim() === "Regional Effects") {
      this.actionInfo.activation.type = "";
    }
    return this.data;
  }

  #buildLegendary() {
    // for the legendary actions feature itself we don't want to do most processing
    if (this.name === "Legendary Actions") {
      this.activityType = "none";
      this.actionInfo.activation.type = "";
      return;
    }

    this.actionInfo.activation.type = "legendary";

    this.actionInfo.consumptionTargets.push({
      type: "attribute",
      target: "resources.legact.value",
      value: this.actionInfo.activation.value ?? 1,
      scaling: {
        mode: "",
        formula: "",
      },
    });

    if (Number.isInteger(parseInt(this.actionInfo.activation.value))) {
      this.actionInfo.consumptionValue = this.actionInfo.activation.value;
    } else {
      // this.data.system.activation.cost = 1;
      this.actionInfo.activation.value = 1;
    }

    // only attempt to update these if we don't parse an action
    // most legendary actions are just do x thing, where thing is an existing action
    // these have been copied from the existing actions so we don't change
    if (!this.actionCopy) {
      this.data.system.uses = this.actionInfo.uses;
      if (this.templateType === "weapon") {
        this.data.system.damage = this.actionInfo.damage;
        this.data.system.range = this.actionInfo.range;
      }
    } else {
      for (const id of Object.keys(this.data.system.activities)) {
        this.data.system.activities[id].activation = this.actionInfo.activation;
        this.data.system.activities[id].consumption.targets = this.actionInfo.consumptionTargets;
      }
    }

  }

  #buildSpecial() {
    if (Number.isInteger(parseInt(this.actionInfo.activation.value))) {
      this.actionInfo.consumptionValue = this.actionInfo.activation.value;
    } else {
      this.actionInfo.activation.value = 1;
    }

    this.data.system.uses = this.actionInfo.uses;

    if (this.templateType === "weapon") {
      this.data.system.damage = this.actionInfo.damage;
      this.data.system.range = this.actionInfo.range;
    }

    // legendary resistance check
    const resistanceMatch = this.name.match(/Legendary Resistance \((\d+)\/Day/i);
    if (resistanceMatch) {
      this.actionInfo.activation.type = "special";
      this.actionInfo.activation.value = null;
      this.actionInfo.consumptionTargets.push({
        type: "attribute",
        target: "resources.legres.value",
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      });
      this.data.system.uses = {
        max: null,
        value: null,
      };
    }

    // if this special action has nothing to do, then we remove the activation type
    // if (this.activityType === null
    //   && (this.data.system.uses.max === null || this.data.system.uses.max === 0)
    //   // TODO: ensure this is now correct
    //   && this.data.system.uses.recovery.length === 0
    // ) {
    //   this.actionInfo.activation = {
    //     value: null,
    //     type: "",
    //     condition: "",
    //   };
    // }
  }

  #buildVillain() {
    if (this.name !== "Villain Actions") {
      this.data.system.uses = {
        spent: 0,
        max: this.actionInfo.uses.max ? `${this.actionInfo.uses.max}` : null,
        recovery: [
          { period: "sr", type: 'recoverAll', formula: undefined },
        ],
      };
    }

    if (this.templateType === "weapon") {
      this.data.system.damage = this.actionInfo.damage;
      this.data.system.range = this.actionInfo.range;
    }

  }

  #generateActionInfo() {
    if (this.weaponAttack || this.spellAttack) {
      this.generateWeaponAttackInfo();
    }
    this.generateDamageInfo();

    this.actionInfo.range = this.getRange();
    this.actionInfo.activation = this.getActivation();
    this.actionInfo.save = this.getFeatSave();
    this.actionInfo.target = this.getTarget();
    this.actionInfo.uses = this.getUses();
  }

  _getSaveActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const startEndDamageParts = this.ddbMonsterDamage.saves.parts;

    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
      damageParts: startEndDamageParts?.length > 0 ? startEndDamageParts : [],
    }, options);

    return super._getSaveActivity({ name, nameIdPostfix }, itemOptions);
  }

  _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const isFlatWeaponDamage = this.templateType === "weapon" && this.actionInfo.damageParts.length > 0
      ? !this.actionInfo.damageParts[0].includesDice
      : false;

    const noDamageMods = this.actionInfo.damageParts.every((p) => !p.damageHasMod);
    const noModWeapon = this.templateType === "weapon" && noDamageMods;

    let parts = [];

    if (this.actionInfo.damageParts.length > 1 && !this.ddbMonsterDamage.saves.type) {
      // otherwise we assume the weapon attack wants the base damage
      if (!this.isSave && this.templateType === "weapon") parts = this.actionInfo.damageParts.slice(1).map((s) => s.part);
      else if (!this.isSave) parts = this.actionInfo.damageParts.map((s) => s.part);
    } else if (isFlatWeaponDamage || noModWeapon) {
      // includes no dice, i.e. is flat, we want to ignore the base damage
      parts = this.actionInfo.damageParts.map((s) => s.part);
    } else if (this.isSave && this.templateType === "feat") {
      // e.g. Armanite Hooves
      parts = this.actionInfo.damageParts.map((s) => s.part);
    }

    // console.warn("activity build", {
    //   isFlatWeaponDamage,
    //   this: this,
    //   noDamageMods,
    //   noModWeapon,
    //   parts,
    //   options,
    //   includeBaseDamage: (this.templateType === "weapon" && !isFlatWeaponDamage) && !noModWeapon,
    // })

    const itemOptions = foundry.utils.mergeObject({
      generateAttack: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: parts.length > 0 || !this.isSave,
      includeBaseDamage: (this.templateType === "weapon" && !isFlatWeaponDamage) && !noModWeapon,
      damageParts: parts,
    }, options);

    return super._getAttackActivity({ name, nameIdPostfix }, itemOptions);
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
    }, options);

    return super._getUtilityActivity({ name, nameIdPostfix }, itemOptions);
  }

  _getDamageActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const itemOptions = foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
    }, options);

    return super._getDamageActivity({ name, nameIdPostfix }, itemOptions);
  }

  #addSaveAdditionalActivity(includeBase = false) {
    const startEndDamageParts = this.ddbMonsterDamage.saves.parts;
    const parts = this.templateType !== "weapon" || includeBase
      ? this.actionInfo.damageParts.map((dp) => dp.part)
      : this.actionInfo.damageParts.slice(1).map((dp) => dp.part);

    this.additionalActivities.push({
      name: "Save",
      type: "save",
      options: {
        generateDamage: this.actionInfo.damageParts.length > 1,
        damageParts: startEndDamageParts ?? parts,
        includeBaseDamage: false,
      },
    });
  }

  #addHealAdditionalActivities() {
    for (const part of this.actionInfo.healingParts) {
      this.additionalActivities.push({
        type: "heal",
        options: {
          generateDamage: false,
          includeBaseDamage: false,
          generateHealing: true,
          healingPart: part.part,
        },
      });
    }
  }

  _getActivitiesType() {
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (this.name === "Legendary Actions") return null;
    if (this.healingAction) {
      if (!this.isAttack && !this.isSave && this.actionInfo.damageParts.length === 0) {
        // we generate heal activities as additionals;
        return null;
      }
    }
    if (this.isAttack) {
      // some attacks will have a save and attack
      if (this.isSave) {
        if (this.actionInfo.damageParts.length > 0) {
          this.#addSaveAdditionalActivity(false);
        }
      }
      return "attack";
    }
    if (this.isSave) return "save";
    if (this.actionInfo.damageParts.length > 0) return "damage";
    // we generate heal activities as additionals;
    if (!this.healingAction && this.actionInfo.healingParts.length > 0) return null;
    if (this.actionInfo.activation.type === "special" && !this.actionInfo.uses.max) {
      return null;
    }
    if (this.actionInfo.activation.type && !this.healingAction) return "utility";
    return null;
  }

  async _generateEffects() {
    // if (this.data.effects.length === 0) this.#addConditionEffects();

    const flags = {
      ddbimporter: {},
    };

    if (this.isAttack && this.isSave) {
      flags.ddbimporter.activityMatch = "Save";
    }

    const overtimeGenerator = new Effects.MidiOverTimeEffect({
      document: this.data,
      actor: this.ddbMonster.npc,
      otherDescription: this.strippedHtml,
      flags,
    });

    const deps = Effects.AutoEffects.effectModules();
    if (!deps.hasCore || !this.ddbMonster.addMonsterEffects) {
      logger.debug(`Adding Condition Effects to ${this.name}`);
      overtimeGenerator.generateConditionOnlyEffect();
    } else if (this.ddbMonster.addMonsterEffects) {
      logger.debug(`Adding Over Time Effects to ${this.name}`);
      overtimeGenerator.generateOverTimeEffect();
    }

    if (this.enricher.clearAutoEffects) this.data.effects = [];
    const effects = await this.enricher.createEffects();
    this.data.effects.push(...effects);
    this.enricher.createDefaultEffects();

    this._activityEffectLinking();
    Effects.AutoEffects.forceDocumentEffect(this.data);
  }

  #getSpellcastingData() {
    const result = {
      dc: null,
      ability: null, // ability associated
      material: true,
      innateMatch: false,
      concentration: true,
      innate: false,
    };

    const abilitySearch = /((?:spellcasting ability) (?:is|uses|using) (\w+)| (\w+)(?: as \w+ spellcasting ability))/;
    const abilityMatch = this.strippedHtml.match(abilitySearch);
    if (abilityMatch) {
      const ability = abilityMatch[2] ?? abilityMatch[3];
      result.ability = ability.toLowerCase().substr(0, 3);
    }

    const dcSearch = /spell\s+save\s+DC\s*(\d+)(?:,|\)|\s)/i;
    const dcMatch = this.strippedHtml.match(dcSearch);
    if (dcMatch) {
      result.dc = parseInt(dcMatch[1]);
    }

    const noMaterialSearch = new RegExp(/no material component|no component|no spell components/);
    const noMaterialMatch = noMaterialSearch.test(this.strippedHtml);
    if (noMaterialMatch) {
      result.material = false;
    }

    const noConcentrationSearch = new RegExp(/no concentration|no material components or concentration|no spell components or concentration/);
    const noConcentrationMatch = noConcentrationSearch.test(this.strippedHtml);
    if (noConcentrationMatch) {
      result.concentration = false;
    }

    if (this.originalName.startsWith("Innate Spellcasting")) {
      result.innate = true;
    }

    return result;
  }

  #generateSpellcastingData() {
    this.spellCastingData = this.#getSpellcastingData();
  }

  async #getCastSpellActivitySpellData(spellData, compendiumSpell) {
    const spellOverride = {
      uuid: compendiumSpell.uuid,
      properties: [],
      level: null,
      challenge: {
        attack: null,
        save: null,
        override: false,
      },
      spellbook: true,
    };

    const consumptionOverride = {
      spellSlot: false,
      targets: [],
      scaling: {
        allowed: false,
        max: "",
      },
    };

    const usesOverride = {
      spent: null,
      recovery: [],
      max: "",
    };

    let generateActivityUses = false;
    let generateConsumption = false;

    if (!this.spellCastingData.concentration || spellData.noConcentration)
      spellOverride.properties.push("concentration");
    if (!this.spellCastingData.material) spellOverride.properties.push("material");
    if (spellData.level) spellOverride.level = spellData.level;

    if (spellData.consumeType || spellData.period) {
      generateConsumption = true;
      consumptionOverride.targets.push({
        type: spellData.consumeType ?? "activityUses",
        value: "1",
        scaling: {},
      });
    }

    if (this.type === "legendary") {
      generateConsumption = true;
      consumptionOverride.targets.push({
        type: "attribute",
        value: "1",
        target: "resources.legact.value",
        scaling: {},
      });
    }

    if (spellData.period) {
      generateActivityUses = true;
      usesOverride.spent = "0";
      usesOverride.max = `${spellData.quantity}` ?? "1";
      const resetType = DICTIONARY.resets.find((reset) =>
        reset.id == spellData.period,
      )?.value ?? "lr";
      usesOverride.recovery.push({
        period: resetType,
        type: "recoverAll",
      });
    }

    if (this.spellCastingData.ability
      && this.spellCastingData.ability !== this.ddbMonster.npc.system.attributes.spellcasting
    ) {
      spellOverride.ability = this.spellCastingData.ability;
    }

    if (this.spellCastingData.dc
      && parseInt(this.spellCastingData.dc) !== parseInt(this.ddbMonster.npc.system.attributes.spelldc)
    ) {
      spellOverride.challenge.override = true;
      spellOverride.challenge.save = this.spellCastingData.dc;
    }

    const options = {
      spellOverride,
      generateConsumption: generateConsumption,
      generateUses: generateActivityUses,
      usesOverride,
      consumptionOverride,
      generateTarget: spellData.targetSelf,
    };

    const activity = this._getCastActivity({
      name: spellData.extra ? `${spellData.name} (${spellData.extra})` : spellData.name,
    }, options);

    if (spellData.targetSelf) {
      activity.data.target.override = true;
      activity.data.target.affects.type = "self";
    }

    if (spellData.duration) {
      activity.data.duration = foundry.utils.mergeObject((activity.data.duration ?? {}), spellData.duration);
      activity.data.duration.override = true;
    }

    this.enricher.customFunction({
      name: spellData.name,
      activity: activity,
    });

    activity.img = compendiumSpell.img;

    // console.warn("spell activite", {
    //   activity,
    //   spellData,
    //   compendiumSpell,
    //   options,
    // });


    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

  }

  #getSpellcastingSpells() {
    const html = this.html
      .replace("Illusionbr/&gt; ", "Illusion</p><p> ") // faerie dragon parsing issue
      .replaceAll(/<br>/g, "</p><p>")
      .replaceAll(/<br \/>/g, "</p><p>");

    const dom = utils.htmlToDocumentFragment(html);

    dom.childNodes.forEach((node) => {
      if (node.textContent == "\n") {
        dom.removeChild(node);
      }
    });

    const spells = [];

    dom.childNodes.forEach((node) => {
      const spellText = utils.nameString(node.textContent);
      const trimmedText = spellText.trim();
      const spellData = DDBDescriptions.parseOutMonsterSpells(trimmedText);
      spells.push(...spellData);
    });

    logger.debug(`${this.ddbMonster.name}: ${this.name}: Parsed spellcasting spells`, {
      spells,
    });

    return spells;
  }

  async #retrieveCompendiumSpells(spellNames) {
    const compendiumName = await game.settings.get(SETTINGS.MODULE_ID, "entity-spell-compendium");

    const results = await CompendiumHelper.queryCompendiumEntries({
      compendiumName,
      documentNames: spellNames,
      getDocuments: false,
      matchedProperties: {
        "system.source.rules": this.use2024Spells ? "2024" : "2014",
      },
    });
    const cleanResults = results.filter((item) => item !== null);

    return cleanResults;
  }


  // spell = {
  //   name: "Fireball", //required
  //   level: "5", // optional
  //   extra: null, // extra to append to name string
  //   period: "Day", // reset timeframe
  //   quantity: "2"  // quantity available per period
  //   consumeType: "itemUses",// defaults to activity uses
  //   targetSelf: true,
  //   noComponents: true,
  //   duration: {},
  // }
  async #buildSpellcastingActivities(spells) {

    const compendiumSpellsIndex = await this.#retrieveCompendiumSpells(spells.map((spell) => spell.name));

    for (const spell of spells) {
      const entry = compendiumSpellsIndex.find((i) => i.name.toLowerCase() === spell.name.toLowerCase());
      if (!entry) {
        logger.error(`Unable to find spell ${spell.name} for ${this.ddbMonster.name} ${this.originalName}, have you munched spells?`, {
          spell,
          this: this,
          spells,
        });
        continue;
      }
      this.#getCastSpellActivitySpellData(spell, entry);
    }
  }

  async #buildOtherSpellActivities() {
    const basicRegex = /The (?:.*) casts(?: the)? (?<spells>.*?)(?: spell| on that creature)?(?<self>on itself)?(?: in response to (?:the|that) spell’s trigger)?, (?<components>requiring no spell components and )?using the same spellcasting ability as Spellcasting/i;
    const basicMatch = this.strippedHtml.match(basicRegex);

    const useRegex = /The (?:.*) uses Spellcasting to cast (?<spells>.*?)(?<self> on itself)?(?:, and it can|\.)/i;
    const useMatch = this.strippedHtml.match(useRegex);
    const canCastRegex = /the (?:.*) can cast one of the following spells, (?:.*): (?<spells>.*?)\./i;
    const canCastMatch = this.strippedHtml.match(canCastRegex);

    const lairRegex = /While in its lair, the (?:.*) can cast (?<spells>.*?), (?<components>requiring no spell components and )?using the same spellcasting ability as its Spellcasting action./i;
    const lairMatch = this.strippedHtml.match(lairRegex);

    const matches = basicMatch ?? useMatch ?? canCastMatch ?? lairMatch;
    const spells = [];
    if (matches) {
      // console.warn(`Other spell casting match for ${this.name} for ${this.ddbMonster.name}`, {
      //   matches,
      //   strippedHtml: this.strippedHtml,
      //   originalName: this.originalName,
      //   this: this,
      // });

      const perUseRegex = /The (?:.*) must finish a (\w+) Rest before using this trait to cast that spell again/i;
      const perUseMatch = this.strippedHtml.match(perUseRegex);

      const names = DDBDescriptions.splitStringByComma(matches.groups.spells.replace(", or ", ", ").replace(" or ", ", "));
      for (const name of names) {
        const spell = {
          name: name, // required
          // level: "5", // optional
          // extra: null, // extra to append to name string
          // period: "Day", // reset timeframe
          // quantity: "2",
          // consumeType: "itemUses",
          // targetSelf: true,
          // noComponents: true,
          // duration: {},
        };

        if (matches.groups.self) {
          spell.extra = "on itself";
          spell.targetSelf = true;
        }
        if (matches.groups.components) {
          spell.noComponents = true;
        }

        if (perUseMatch) {
          spell.period = perUseMatch[1].trim();
          spell.quantity = "1";
          spell.consumeType = "activityUses";
        } else if (this.data.system.uses.max) {
          spell.consumeType = "itemUses";
          spell.quantity = "1";
        }
        spells.push(spell);
      }

      logger.verbose(spells);
    }
    if (spells.length > 0) {
      await this.#buildSpellcastingActivities(spells);
    }
  }

  async #handleSpellCasting() {
    if (!this.useCastActivity) return;
    this.#generateSpellcastingData();

    const spellcastingMatch = this.originalName.startsWith("Spellcasting")
      || this.originalName.startsWith("Innate Spellcasting");

    if (spellcastingMatch) {
      const spells = this.#getSpellcastingSpells();
      await this.#buildSpellcastingActivities(spells);
    } else {
      await this.#buildOtherSpellActivities();
    }

    if (Object.keys(this.data.system.activities).length > 0) {
      this.ignoreActivityGeneration = true;
      if (spellcastingMatch) {
        this.data.system.uses = {
          spent: null,
          recovery: [],
          max: "",
        };
      }
    }

  }


  async parse() {

    await this.enricher.init();

    this.#generateActionInfo();
    switch (this.type) {
      case "action":
      case "mythic":
      case "reaction":
      case "bonus":
        this.#buildAction();
        break;
      case "lair":
        this.#buildLair();
        break;
      case "legendary":
        this.#buildLegendary();
        break;
      case "villain":
        this.#buildVillain();
        break;
      case "special":
        this.#buildSpecial();
        break;
      default:
        logger.error(`Unknown action parsing type ${this.type}`, { DDBFeature: this });
        throw new Error(`Unknown action parsing type ${this.type}`);
    }

    if (!this.actionCopy) {
      await this.#handleSpellCasting();
      await this._generateActivity();
      this.#addHealAdditionalActivities();
      if (this.enricher.addAutoAdditionalActivities)
        await this._generateAdditionalActivities();
      await this.enricher.addAdditionalActivities(this);
      this._generateEffects();
    }

    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.damage", this.actionInfo.damage);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.damageParts", this.actionInfo.damageParts);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.baseAbility", this.actionInfo.baseAbility);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.toHit", this.toHit);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.proficient", this.actionInfo.proficient);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.extraAttackBonus", this.actionInfo.extraAttackBonus);

    if (this.levelBonus)
      foundry.utils.setProperty(this.data, "flags.ddbimporter.levelBonus", true);
    await this.#generateDescription();

    await this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(this.data.name.toLowerCase());

    logger.debug(`Parsed Feature ${this.name} for ${this.ddbMonster.name}`, { feature: this });

  }

}
