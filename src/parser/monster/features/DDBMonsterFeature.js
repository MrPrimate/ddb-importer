import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";
import DICTIONARY from "../../../dictionary.js";
import { generateTable } from "../../../lib/DDBTable.js";
import SETTINGS from "../../../settings.js";
import { parseDamageRolls, parseTags } from "../../../lib/DDBReferenceLinker.js";
import DDBMonsterFeatureActivity from "./DDBMonsterFeatureActivity.js";

export default class DDBMonsterFeature {

  #generateAdjustedName() {
    this.originalName = `${this.name}`;
    if (!this.stripName) return;
    const regex = /(.*)\s*\((:?costs? \d actions|Recharges after a (Short or Long|Long) Rest|(?!Spell;|Psionics;).*\d\/day|recharge \d ?- ?\d|Recharge \d)\)/i;
    const nameMatch = this.name.replace(/[–-–−]/g, "-").match(regex);
    if (nameMatch) {
      this.feature.name = nameMatch[1].trim();
      this.nameSplit = nameMatch[2];
    } else {
      const regex2 = /(.*)\s*\((.*); (:?costs \d actions|Recharges after a (Short or Long|Long) Rest|(?!Spell;|Psionics;).*\d\/day|recharge \d-\d|Recharge \d)\)/i;
      const nameMatch2 = this.name.replace(/[–-–−]/g, "-").match(regex2);
      if (nameMatch2) {
        this.feature.name = `${nameMatch2[1].trim()} (${nameMatch2[2].trim()})`;
        this.nameSplit = nameMatch2[3];
      }
    }
  }

  createBaseFeature() {
    this.feature = {
      _id: foundry.utils.randomID(),
      name: this.name,
      type: this.templateType,
      system: utils.getTemplate(this.templateType),
      effects: [],
      flags: {
        ddbimporter: {
          levelBonus: false,
          dndbeyond: {
          },
        },
        monsterMunch: {
          titleHTML: this.titleHTML,
          fullName: this.fullName,
          actionCopy: this.actionCopy,
          type: this.type,
        },
      },
    };
    // these templates not good
    this.feature.system.duration.value = "";
    this.feature.system.requirements = "";
    this.levelBonus = false;
  }

  // prepare the html in this.html for a parse, runs some checks and pregen to calculate values
  prepare() {
    this.strippedHtml = utils.stripHtml(`${this.html}`).trim();

    const matches = this.strippedHtml.match(
      /(Melee|Ranged|Melee\s+or\s+Ranged)\s+(|Weapon|Spell)\s*Attack:\s*([+-]\d+|your (?:\w+\s*)*)\s+(plus PB\s|\+ PB\s)?to\s+hit/i,
    );

    const healingRegex = /(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i;
    const healingMatch = healingRegex.test(this.strippedHtml);

    // set calc flags
    this.isAttack = matches ? matches[1] !== undefined : false;
    this.pbToAttack = matches ? matches[4] !== undefined : false;
    this.weaponAttack = matches
      ? (matches[2].toLowerCase() === "weapon" || matches[2] === "")
      : false;
    this.spellAttack = matches ? matches[2].toLowerCase() === "spell" : false;
    this.meleeAttack = matches ? matches[1].indexOf("Melee") !== -1 : false;
    this.rangedAttack = matches ? matches[1].indexOf("Ranged") !== -1 : false;
    this.healingAction = healingMatch;
    this.toHit = matches
      ? Number.isInteger(parseInt(matches[3]))
        ? parseInt(matches[3])
        : 0
      : 0;
    this.isRecharge = this.#matchRecharge();
    this.templateType = this.isAttack && this.isRecharge === null ? "weapon" : "feat";
    this.yourSpellAttackModToHit = matches ? matches[3]?.startsWith("your spell") : false;

    if (!this.feature) this.createBaseFeature();
    this.#generateAdjustedName();

    // if not attack set to a monster type action
    if (!this.isAttack) foundry.utils.setProperty(this.feature, "system.type.value", "monster");

  }

  constructor(name, { ddbMonster, html, type, titleHTML, fullName, actionCopy, updateExisting, hideDescription } = {}) {

    this.name = name.trim();
    this.ddbMonster = ddbMonster;
    this.type = type;
    this.html = html ?? "";
    this.titleHTML = titleHTML ?? undefined;
    this.fullName = fullName ?? this.name;
    this.actionCopy = actionCopy ?? false;

    this.activityType = null;

    this.hideDescription = hideDescription ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description");
    this.updateExisting = updateExisting ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
    this.stripName = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-strip-name");

    this.prepare();

    // copy source details from parent
    if (this.ddbMonster) this.feature.system.source = this.ddbMonster.npc.system.details.source;

    this.actionInfo = {
      baseItem: null,
      baseTool: null,
      damage: {
        base: null,
        onSave: null,
        parts: [],
        versatile: "",
      },
      damageParts: [],
      formula: "",
      damageSave: {
        dc: null,
        ability: null,
      },
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
        cost: null,
        condition: "",
      },
      // save: {
      //   dc: null,
      //   ability: "",
      //   scaling: "flat",
      //   half: false,
      // },
      save: {
        ability: "",
        dc: {
          calculation: "",
          formula: "",
        },
      },
      uses: {
        spent: null,
        max: null,
        recovery: [
          // { period: "", type: 'recoverAll', formula: undefined },
        ],
      },
    };
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

  // eslint-disable-next-line complexity
  generateExtendedDamageInfo() {
    const hitIndex = this.strippedHtml.indexOf("Hit:");
    let hit = (hitIndex > 0) ? this.strippedHtml.slice(hitIndex) : `${this.strippedHtml}`;
    hit = hit.split("At the end of each")[0].split("At the start of each")[0];
    hit = hit.replace(/[–-–−]/g, "-");
    // console.warn(hit);
    // Using match with global modifier then map to regular match because RegExp.matchAll isn't available on every browser
    // eslint-disable-next-line no-useless-escape
    const damageExpression = new RegExp(/((?:takes|saving throw or take\s+)|(?:[\w]*\s+))(?:([0-9]+))?(?:\s*\(?([0-9]*d[0-9]+(?:\s*[-+]\s*(?:[0-9]+|PB|the spell[’']s level))*(?:\s+plus [^\)]+)?)\)?)?\s*([\w ]*?)\s*damage(?: when used with | if (?:used|wielded) with )?(\s?two hands|\s?at the start of|\son a failed save)?/gi);

    const matches = [...hit.matchAll(damageExpression)];
    const regainExpression = new RegExp(/(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/);
    const regainMatch = hit.match(regainExpression);

    logger.debug(`${this.name} Damage matches`, { hit, matches, regainMatch });
    let versatile = false;
    for (const dmg of matches) {
      let other = false;
      let thisVersatile = false;
      let thisOther = false;
      if (dmg[1] == "DC " || dmg[4] == "hit points by this") {
        continue; // eslint-disable-line no-continue
      }
      // check for versatile
      if (dmg[1] == "or " || dmg[5] == "two hands") {
        versatile = true;
      }
      // check for other
      if (dmg[5] && dmg[5].trim() == "at the start of") other = true;
      const profBonus = dmg[3]?.includes(" + PB") || dmg[3]?.includes(" plus PB") ? "@prof" : "";
      const levelBonus = dmg[3] && (/the spell[’']s level/i).test(dmg[3]); // ? "@item.level" : "";
      if (levelBonus) {
        this.levelBonus = true;
        foundry.utils.setProperty(this, "flags.ddbimporter.levelBonus", true);
      }
      const damage = profBonus !== "" || levelBonus
        ? `${dmg[2]}${dmg[3].replace(" + PB", "").replace(" plus PB", "").replace(" + the spell’s level", "").replace(" + the spell's level", "")}`
        : dmg[3] ?? dmg[2];

      // Make sure we did match a damage
      if (damage) {
        const includesDiceRegExp = /[0-9]*d[0-9]+/;
        const includesDice = includesDiceRegExp.test(damage);
        const parsedDiceDamage = (this.actionInfo && includesDice)
          ? this.damageModReplace(damage.replace("plus", "+"), dmg[4])
          : damage.replace("plus", "+");

        const finalDamage = [parsedDiceDamage, profBonus].filter((t) => t !== "").join(" + ");

        // if this is a save based attack, and multiple damage entries, we assume any entry beyond the first is going into
        // versatile for damage
        // ignore if dmg[1] is and as it likely indicates the whole thing is a save
        if ((((dmg[5] ?? "").trim() == "on a failed save" && (dmg[1] ?? "").trim() !== "and")
            || (dmg[1] && dmg[1].includes("saving throw")))
          && this.actionInfo.damage.parts.length >= 1
        ) {
          other = true;
          thisOther = true;
        }
        // assumption here is that there is just one field added to versatile. this is going to be rare.
        if (other) {
          if (this.actionInfo.formula == "") this.actionInfo.formula = finalDamage;
          else this.actionInfo.formula += ` + ${finalDamage}`;

          if (!thisOther && dmg[1].trim() == "plus") {
            this.actionInfo.damage.versatile += ` + ${finalDamage}`;
            this.actionInfo.damage.parts.push([finalDamage, dmg[4]]);
          }
        } else if (versatile) {
          if (this.actionInfo.damage.versatile == "") this.actionInfo.damage.versatile = finalDamage;
          // so things like the duergar mind master have oddity where we might want to use a different thing
          // } else {
          //   result.damage.versatile += ` + ${finalDamage}`;
          // }
          if (!thisVersatile && dmg[1].trim() == "plus") {
            this.actionInfo.damage.versatile += ` + ${finalDamage}`;
            this.actionInfo.damage.parts.push([finalDamage, dmg[4]]);
          }
        } else {
          this.actionInfo.damage.parts.push([finalDamage, dmg[4]]);
        }
      }
    }

    if (regainMatch) {
      const globalDamageHints = false;
      const damageHint = globalDamageHints ? `[healing]` : "";
      const damageValue = regainMatch[3] ? regainMatch[3] : regainMatch[2];
      this.actionInfo.damage.parts.push([utils.parseDiceString(damageValue, null, damageHint).diceString, 'healing']);
      this.feature.system.actionType = "heal";
    }

    const save = hit.match(/DC ([0-9]+) (.*?) saving throw|\(save DC ([0-9]+)\)/);
    if (save) {
      this.actionInfo.damageSave.dc = save[1];
      this.actionInfo.damageSave.ability = save[2] ? save[2].toLowerCase().substr(0, 3) : "";
    } else {
      const escape = hit.match(/escape DC ([0-9]+)/);
      if (escape) {
        this.actionInfo.damageSave.dc = escape[1];
        this.actionInfo.damageSave.ability = "Escape";
      }
    }
  }

  getAction() {
    let action = this.type;
    // foundry doesn't support mythic actions pre 1.6
    if (this.type === "mythic") action = "mythic";
    if (this.type === "villain") action = "special";
    const actionAction = this.strippedHtml.toLowerCase().match(/as (a|an) action/);
    const bonusAction = this.strippedHtml.toLowerCase().match(/as a bonus action/);
    const reAction = this.strippedHtml.toLowerCase().match(/as a reaction/);
    // e.g. mephit death
    const specialDie = this.strippedHtml.toLowerCase().match(/dies/);
    if (bonusAction) {
      action = "bonus";
    } else if (reAction) {
      action = "reaction";
    } else if (specialDie) {
      action = "special";
    } else if (actionAction) {
      action = "action";
    }
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
    // console.log(usesMatch);
    if (usesMatch && usesMatch[2].toLowerCase() !== "turn") {
      uses.spent = 0;
      uses.max = usesMatch[1];
      recovery.period = "day";
      const perMatch = DICTIONARY.monsters.resets.find((reset) => reset.id === usesMatch[2]);
      if (perMatch) recovery.period = perMatch.value;
    } else {
      const shortLongRegex = (/Recharges after a (Short or Long|Long) Rest/i);
      const rechargeMatch = matchString.match(shortLongRegex);
      if (rechargeMatch) {
        recovery.period = rechargeMatch[1] === "Long" ? "lr" : "sr";
        uses.max = 1;
      }
    }

    if (recovery.period) {
      uses.recovery.push(recovery);
    }

    const recharge = this.#getRechargeRecovery();
    if (recharge.length) {
      uses.recovery.push(recharge);
    }

    return uses;
  }

  getActivation() {
    const matches = this.strippedHtml.match(/\(costs ([0-9]+) actions\)/i);
    if (matches) return parseInt(matches[1]);
    const nameMatch = this.name.match(/\(costs ([0-9]+) actions\)/i);
    if (nameMatch) return parseInt(nameMatch[1]);
    return null;
  }

  getFeatSave() {

    // save: {
    //   ability: "",
    //   dc: {
    //     calculation: "custom",
    //     formula: "",
    //   },
    // },
    const saveSearch = /DC (\d+) (\w+) (saving throw|check)/i;
    const match = this.strippedHtml.match(saveSearch);
    if (match) {
      this.actionInfo.save.dc.formula = parseInt(match[1]);
      this.actionInfo.save.dc.formula = "custom";
      this.actionInfo.save.ability = match[2].toLowerCase().substr(0, 3);
    } else {
      const saveSelfSearch = /(\w+) saving throw against your spell save DC/i;
      const selfMatch = this.strippedHtml.match(saveSelfSearch);
      if (selfMatch) {
        this.activityType = "save";
        // this.actionInfo.save.dc = 10;
        this.actionInfo.save.ability = selfMatch[1].toLowerCase().substr(0, 3);
        this.actionInfo.save.dc.formula = "spellcasting";
      }
    }

    const halfSaveSearch = /or half as much damage on a successful one/i;
    const halfMatch = this.strippedHtml.match(halfSaveSearch);
    if (halfMatch) {
      this.actionInfo.damage.onSave = "half";
      if (this.isAttack) {
        foundry.utils.setProperty(this.feature, "flags.midiProperties.otherSaveDamage", "halfdam");
      } else {
        // foundry.utils.setProperty(this.feature, "flags.midiProperties.halfdam", true);
        foundry.utils.setProperty(this.feature, "flags.midiProperties.saveDamage", "halfdam");
      }
    }

    return this.actionInfo.save;
  }

  getReach() {
    const reachSearch = /reach\s*(\s*\d+\s*)\s*ft/;
    const match = this.strippedHtml.match(reachSearch);
    if (!match) return null;
    return match[1];
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
      range.value = parseInt(reachMatch[1]);
      range.units = "ft";
    } else if (withinMatch) {
      range.value = parseInt(withinMatch[1]);
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
      } else if (result.toHit == this.ddbMonster.abilities[ability].mod) {
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

    const lookup = DICTIONARY.monsters.weapons.find((weapon) => this.name.startsWith(weapon.name));
    // we have a weapon name match so we can infer a bit more
    if (lookup) {
      for (const [key, value] of Object.entries(lookup.properties)) {
        // logger.info(`${key}: ${value}`);
        this.actionInfo.properties[key] = value;
      }
      const versatileWeapon = this.actionInfo.properties.ver
        && this.ddbMonster.abilities['dex'].mod > this.ddbMonster.abilities['str'].mod;
      if (versatileWeapon || lookup.actionType == "rwak") {
        weaponAbilities = ["dex"];
      } else if (lookup.actionType == "mwak") {
        weaponAbilities = ["str"];
      }
      this.actionInfo.weaponType = lookup.weaponType;
    } else if (this.meleeAttack) {
      this.actionInfo.weaponType = "simpleM";
    } else if (this.rangedAttack) {
      this.actionInfo.weaponType = "simpleR";
    }

    if (this.strippedHtml.includes("is a magic weapon attack")) {
      this.actionInfo.properties["mgc"] = true;
      foundry.utils.setProperty(this.feature, "flags.midiProperties.magicdam", true);
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

  getTarget() {
    // let target = {
    //   value: null,
    //   width: null,
    //   units: "",
    //   type: "",
    // };

    // TODO: target

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
    const lineSearch = /(\d+)-foot line|line that is (\d+) feet/;
    const coneSearch = /(\d+)-foot cone/;
    const cubeSearch = /(\d+)-foot cube/;
    const sphereSearch = /(\d+)-foot-radius sphere/;

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
    }

    if (target.template.type === "" && this.healingAction) {
      target.template.type = "self";
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
    if (["rwak", "mwak"].includes(this.feature.system.actionType)) {
      const featureName = hideItemName ? "" : ` with its [[lookup @item.name]]`;
      description += `\n</section>\nThe ${actorDescriptor} attacks${featureName}.`;
    } else if (["rsak", "msak"].includes(this.feature.system.actionType)) {
      const featureName = hideItemName ? "a spell" : "[[lookup @item.name]]";
      description += `\n</section>\nThe ${actorDescriptor} casts ${featureName}.`;
    } else if (["save"].includes(this.feature.system.actionType)) {
      const featureName = hideItemName ? "a feature" : "[[lookup @item.name]]";
      description += `\n</section>\nThe ${actorDescriptor} uses ${featureName} and a save is required.`;
    } else {
      description += `\n</section>\nThe ${actorDescriptor} uses ${hideItemName ? "a feature" : "[[lookup @item.name]]"}.`;
    }
    return description;
  }

  async #generateDescription() {
    let description = this.hideDescription ? this.#getHiddenDescription() : `${this.html}`;
    description = description.replaceAll("<em><strong></strong></em>", "");
    description = parseDamageRolls({ text: description, document: this.feature, actor: this.ddbMonster.npc });
    // description = parseToHitRoll({ text: description, document: this.feature });
    description = parseTags(description);
    this.feature.system.description.value = await generateTable(this.ddbMonster.npc.name, description, this.updateExisting);
    this.feature.system.description.value = `<div class="ddb">
${this.feature.system.description.value}
</div>`;
  }

  #buildAction() {
    if (Number.isInteger(this.actionInfo.activation)) {
      this.feature.system.activation.cost = this.actionInfo.activation;
      this.feature.system.consume.amount = this.actionInfo.activation;
    } else {
      this.feature.system.activation.cost = 1;
    }
    this.feature.system.activation.type = this.getAction();

    this.feature.system.save = this.actionInfo.save;
    // assumption - if we have parsed a save dc set action type to save
    if (this.feature.system.save.dc && !this.isAttack) {
      // TODO: refactor saves for action type here
      this.feature.system.actionType = "save";
    }

    this.feature.system.damage = this.actionInfo.damage;
    this.feature.system.formula = this.actionInfo.formula;
    for (const [key, value] of Object.entries(this.actionInfo.properties)) {
      if (value) this.feature.system.properties.push(key);
    }
    this.feature.system.proficient = this.actionInfo.proficient;
    this.feature.system.ability = this.actionInfo.baseAbility;
    this.feature.system.attack.bonus = `${this.actionInfo.extraAttackBonus}`;

    if (this.weaponAttack) {
      if (this.templateType !== "feat") {
        this.feature.system.type.value = this.actionInfo.weaponType;
        this.feature.system.equipped = true;
      }
      // console.log(actionInfo.weaponAttack);
      // console.log(actionInfo.meleeAttack);
      // console.log(actionInfo.rangedAttack);
      if (this.meleeAttack) {
        this.feature.system.actionType = "mwak";
      } else if (this.rangedAttack) {
        this.feature.system.actionType = "rwak";
      }
    } else if (this.spellAttack) {
      if (this.meleeAttack) {
        this.feature.system.actionType = "msak";
      } else if (this.rangedAttack) {
        this.feature.system.actionType = "rsak";
      } else {
        this.feature.system.actionType = "save";
      }
      if (this.templateType === "feat") {
        this.feature.system.equipped = true;
      }
      foundry.utils.setProperty(this.feature, "flags.midiProperties.magicdam", true);
      foundry.utils.setProperty(this.feature, "flags.midiProperties.magiceffect", true);
      this.feature.system.properties.mgc = true;
    } else if (this.actionInfo.save.dc) {
      // TODO: refactor saves for action type here
      this.feature.system.actionType = "save";
    }

    this.feature.system.range = this.actionInfo.range;
    this.feature.system.target = this.actionInfo.target;
    this.feature.system.duration = this.actionInfo.duration;
    this.feature.system.uses = this.actionInfo.uses;

    if (this.name.includes("/Day")) {
      this.feature.system.uses = this.getUses(true);
    }

    return this.feature;
  }

  #buildLair() {
    if (this.feature.name.trim() === "Lair Actions") {
      this.feature.system.activation.cost = 1;
    }
    return this.feature;
  }

  #buildLegendary() {
    // for the legendary actions feature itself we don't want to do most processing
    if (this.name === "Legendary Actions") {
      this.feature.system.activation.type = "";
      return;
    }

    this.feature.system.activation.type = "legendary";

    // TODO: is consume removed?
    this.feature.system.consume = {
      type: "attribute",
      target: "resources.legact.value",
      amount: 1,
    };

    if (Number.isInteger(this.actionInfo.activation)) {
      this.feature.system.activation.cost = this.actionInfo.activation;
      this.feature.system.consume.amount = this.actionInfo.activation;
    } else {
      this.feature.system.activation.cost = 1;
    }

    // only attempt to update these if we don't parse an action
    // most legendary actions are just do x thing, where thing is an existing action
    // these have been copied from the existing actions so we don't change
    if (!this.feature.flags.monsterMunch.actionCopy) {
      this.feature.system.uses = this.actionInfo.uses;
      this.feature.system.save = this.actionInfo.save;
      // assumption - if we have parsed a save dc set action type to save
      // TODO: refactor saves for action type here
      if (this.feature.system.save.dc) {
        this.feature.system.actionType = "save";
      // action.type = "weapon";
      }
      this.feature.system.range = this.actionInfo.range;
      this.feature.system.target = this.actionInfo.target;
      this.feature.system.damage = this.actionInfo.damage;

      if (!this.feature.system.actionType && !this.isAttack && this.feature.system.damage.parts.length > 0) {
        this.feature.system.actionType = "other";
      }
    }

  }

  #buildSpecial() {
    this.feature.system.activation.type = this.getAction();
    if (Number.isInteger(this.actionInfo.activation)) {
      this.feature.system.activation.cost = this.actionInfo.activation;
      this.feature.system.consume.amount = this.actionInfo.activation;
    } else if (this.feature.system.activation.type !== "") {
      this.feature.system.activation.cost = 1;
    }

    this.feature.system.uses = this.actionInfo.uses;
    this.feature.system.save = this.actionInfo.save;
    this.feature.system.target = this.actionInfo.target;
    // assumption - if we have parsed a save dc set action type to save
    // TODO: refactor saves for action type here
    if (this.feature.system.save.dc) {
      this.feature.system.actionType = "save";
    }
    this.feature.system.damage = this.actionInfo.damage;
    // assumption - if the action type is not set but there is damage, the action type is other
    if (!this.feature.system.actionType && this.feature.system.damage.parts.length != 0) {
      this.feature.system.actionType = "other";
    }

    // legendary resistance check
    const resistanceMatch = this.name.match(/Legendary Resistance \((\d+)\/Day/i);
    if (resistanceMatch) {
      this.feature.system.activation.type = "special";
      this.feature.system.activation.cost = null;
      this.feature.system.consume = {
        type: "attribute",
        target: "resources.legres.value",
        amount: 1,
      };
    }

    // if this special action has nothing to do, then we remove the activation type
    if (this.feature.system.actionType === null
      && (this.feature.system.uses.max === null || this.feature.system.uses.max === 0)
      // TODO: ensure this is now correct
      && this.feature.system.uses.recovery.length === 0
    ) {
      this.feature.system.activation = {
        cost: null,
        type: "",
        condition: "",
      };
    }
  }

  #buildVillain() {
    this.feature.system.activation.type = this.getAction();

    if (this.name !== "Villain Actions") {
      this.feature.system.uses = {
        spent: 0,
        max: 1,
        recovery: [
          { period: "sr", type: 'recoverAll', formula: undefined },
        ],
      };
    }

    // TODO: revisit saves and targets here
    this.feature.system.save = this.actionInfo.save;
    this.feature.system.target = this.actionInfo.target;
    // assumption - if we have parsed a save dc set action type to save
    if (this.feature.system.save.dc) {
      this.feature.system.actionType = "save";
    }
    this.feature.system.damage = this.actionInfo.damage;
    // assumption - if the action type is not set but there is damage, the action type is other
    if (!this.feature.system.actionType && this.feature.system.damage.parts.length != 0) {
      this.feature.system.actionType = "other";
    }

  }

  #generateActionInfo() {
    if (this.weaponAttack || this.spellAttack) {
      this.generateWeaponAttackInfo();
    }
    this.generateExtendedDamageInfo();

    this.actionInfo.range = this.getRange();
    this.actionInfo.activation = this.getActivation();
    this.actionInfo.save = this.getFeatSave();
    this.actionInfo.target = this.getTarget();
    this.actionInfo.uses = this.getUses();
  }

  #linkResourcesConsumption() {
    logger.debug(`Resource linking for ${this.name}`);

    // TODO: fix for activities
    if (
      foundry.utils.getProperty(this.feature, "system.uses.recovery")?.some((r) => r.period === "recharge")
    ) {
      foundry.utils.setProperty(this.feature, "system.consume.type", "charges");
      foundry.utils.setProperty(this.feature, "system.consume.target", this.feature._id);
      foundry.utils.setProperty(this.feature, "system.consume.amount", null);
    }
  }

  _getSaveActivity() {
    this._generateDamage();

    const saveActivity = new DDBMonsterFeatureActivity({
      type: "save",
      ddbMonsterFeature: this,
    });

    saveActivity.build({
      generateSave: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: this.templateType !== "weapon",
    });

    return saveActivity;
  }

  _getAttackActivity() {
    this._generateDamage();

    const attackActivity = new DDBMonsterFeatureActivity({
      type: "attack",
      ddbMonsterFeature: this,
    });

    attackActivity.build({
      generateAttack: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: this.templateType !== "weapon",
    });
    return attackActivity;
  }

  _getUtilityActivity() {
    this._generateDamage();

    const utilityActivity = new DDBMonsterFeatureActivity({
      type: "utility",
      ddbMonsterFeature: this,
    });

    utilityActivity.build({
      generateActivation: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: this.templateType !== "weapon",
    });

    return utilityActivity;
  }

  _getHealActivity() {
    const healActivity = new DDBMonsterFeatureActivity({
      type: "heal",
      ddbMonsterFeature: this,
    });

    healActivity.build({
      generateActivation: true,
      generateDamage: false,
      generateHealing: true,
      generateRange: true,
    });

    return healActivity;
  }

  _getDamageActivity() {
    this._generateDamage();

    const damageActivity = new DDBMonsterFeatureActivity({
      type: "damage",
      ddbMonsterFeature: this,
    });

    damageActivity.build({
      generateAttack: false,
      generateRange: this.templateType !== "weapon",
      generateDamage: this.templateType !== "weapon",
    });
    return damageActivity;
  }

  _getEnchantActivity() {
    this._generateDamage();

    const enchantActivity = new DDBMonsterFeatureActivity({
      type: "enchant",
      ddbMonsterFeature: this,
    });

    enchantActivity.build({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    });
    return enchantActivity;
  }

  _getSummonActivity() {
    const summonActivity = new DDBMonsterFeatureActivity({
      type: "summon",
      ddbMonsterFeature: this,
    });

    summonActivity.build({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    });
    return summonActivity;
  }

  _getActivitiesType() {
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (this.isAttack) {
      return "attack";
    } else if (this.actionInfo.save?.dc) {
      return "save";
    }
    // TODO: can we determine if utility, heal or damage?
    return "utility";
  }

  getActivity({ typeOverride = null, typeFallback = null } = {}) {
    const type = typeOverride ?? this._getActivitiesType();
    switch (type) {
      case "save":
        return this._getSaveActivity();
      case "attack":
        return this._getAttackActivity();
      case "damage":
        return this._getDamageActivity();
      case "heal":
        return this._getHealActivity();
      case "utility":
        return this._getUtilityActivity();
      case "enchant":
        return this._getEnchantActivity();
      case "summon":
        return this._getSummonActivity();
      default:
        if (typeFallback) return this.getActivity(typeFallback);
        return undefined;
    }
  }

  _generateActivity({ hintsOnly = false } = {}) {
    if (hintsOnly && !this.featureEnricher.activity) return undefined;

    const activity = this.getActivity({
      typeOverride: this.featureEnricher.activity?.type ?? this.activityType,
    });

    console.warn(`Monster Feature Activity Check for ${this.data.name}`, {
      this: this,
      activity,
      activityType: this.featureEnricher.activity?.type ?? this.activityType,
    });

    if (!activity) return undefined;

    this.featureEnricher.applyActivityOverride(activity.data);
    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;
  }

  async parse() {
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

    foundry.utils.setProperty(this.feature, "flags.monsterMunch.actionInfo.damage", this.actionInfo.damage);
    foundry.utils.setProperty(this.feature, "flags.monsterMunch.actionInfo.baseAbility", this.actionInfo.baseAbility);
    foundry.utils.setProperty(this.feature, "flags.monsterMunch.actionInfo.toHit", this.toHit);
    foundry.utils.setProperty(this.feature, "flags.monsterMunch.actionInfo.proficient", this.actionInfo.proficient);
    foundry.utils.setProperty(this.feature, "flags.monsterMunch.actionInfo.extraAttackBonus", this.actionInfo.extraAttackBonus);

    await this.#generateDescription();
    this.#linkResourcesConsumption();

    logger.debug(`Parsed Feature ${this.name} for ${this.ddbMonster.name}`, { feature: this });

  }

}
