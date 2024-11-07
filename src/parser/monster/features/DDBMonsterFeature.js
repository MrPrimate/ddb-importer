import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";
import DICTIONARY from "../../../dictionary.js";
import { generateTable } from "../../../lib/DDBTable.js";
import SETTINGS from "../../../settings.js";
import { parseDamageRolls, parseTags } from "../../../lib/DDBReferenceLinker.js";
import DDBMonsterFeatureActivity from "./DDBMonsterFeatureActivity.js";

import { DDBMonsterFeatureEnricher } from "../../enrichers/_module.mjs";
import { DDBBasicActivity } from "../../enrichers/mixins/_module.mjs";

export default class DDBMonsterFeature {

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

    const matches = this.strippedHtml.match(
      /(?<range>Melee|Ranged|Melee\s+or\s+Ranged)\s+(?<type>|Weapon|Spell)\s*(?:Attack|Attack Roll):\s*(?<bonus>[+-]\d+|your (?:\w+\s*)*)\s*(?<pb>plus PB\s|\+ PB\s)?(?:to\s+hit|,|\.)/i,
    );

    const healingRegex = /(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i;
    const healingMatch = healingRegex.test(this.strippedHtml);

    const spellSaveSearch = /(?<ability>\w+) saving throw against your spell save DC/i;
    const spellSave = this.strippedHtml.match(spellSaveSearch);
    const saveSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)/i;
    const saveSearchNew = /(?<ability>\w+) (?<type>saving throw|check): DC (?<dc>\d+)/i;
    const saveMatch = this.strippedHtml.match(saveSearch) ?? this.strippedHtml.match(saveSearchNew);

    const halfSaveSearch = /or half as much damage on a successful one|Success: Half damage/i;
    const halfMatch = halfSaveSearch.test(this.strippedHtml);

    // set calc flags
    this.isAttack = matches ? matches[1] !== undefined : false;
    this.spellSave = spellSave;
    this.savingThrow = saveMatch;
    this.isSave = Boolean(spellSave || saveMatch);
    this.halfDamage = halfMatch;
    this.pbToAttack = matches ? matches[4] !== undefined : false;
    this.weaponAttack = matches
      ? (matches[2].toLowerCase() === "weapon" || matches[2] === "")
      : false;
    // warning - unclear how to parse these out for 2024 monsters
    // https://comicbook.com/gaming/news/dungeons-dragons-first-look-2025-monster-manual/
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

    if (!this.data) this.createBaseFeature();
    this.#generateAdjustedName();

    this.identifier = utils.referenceNameString(this.data.name.toLowerCase());
    this.data.system.identifier = this.identifier;

    // if not attack set to a monster type action
    if (!this.isAttack) foundry.utils.setProperty(this.data, "system.type.value", "monster");

    this.isCompanion = foundry.utils.getProperty(this.ddbMonster, "npc.flags.ddbimporter.entityTypeId") === "companion-feature";

    this.enricher.load({
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
        parts: [],
        versatile: "",
      },
      damageParts: [],
      healingParts: [],
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
        value: null,
        condition: "",
      },
      save: {
        ability: "",
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

    this.name = name.trim();
    this.ddbMonster = ddbMonster;
    this.type = type;
    this.html = html ?? "";
    this.titleHTML = titleHTML ?? undefined;
    this.fullName = fullName ?? this.name;
    this.actionCopy = actionCopy ?? false;
    this.sort = sort ?? null;

    this.activityType = null;
    this.activities = [];
    this.activityTypes = [];

    this.hideDescription = hideDescription ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description");
    this.updateExisting = updateExisting ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
    this.stripName = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-strip-name");

    this.enricher = new DDBMonsterFeatureEnricher();
    this.prepare();

    // copy source details from parent
    if (this.ddbMonster) this.data.system.source = this.ddbMonster.npc.system.details.source;

    this.additionalActivities = [];
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

  // eslint-disable-next-line complexity
  generateDamageInfo() {
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
      const hasProfBonus = dmg[3]?.includes(" + PB") || dmg[3]?.includes(" plus PB");
      const profBonus = hasProfBonus && !this.isCompanion ? "@prof" : "";
      const levelBonus = dmg[3] && (/the spell[’']s level/i).test(dmg[3]); // ? "@item.level" : "";
      if (levelBonus) {
        this.levelBonus = true;
        foundry.utils.setProperty(this, "flags.ddbimporter.levelBonus", true);
      }
      const damage = hasProfBonus || levelBonus
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
          && this.actionInfo.damageParts.length >= 1
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
            const part = DDBBasicActivity.buildDamagePart({ damageString: finalDamage, type: dmg[4], stripMod: this.templateType === "weapon" });
            this.actionInfo.damageParts.push({ profBonus, levelBonus, versatile, other, thisOther, thisVersatile, part, includesDice });
          }
        } else if (versatile) {
          if (this.actionInfo.damage.versatile == "") this.actionInfo.damage.versatile = finalDamage;
          // so things like the duergar mind master have oddity where we might want to use a different thing
          // } else {
          //   result.damage.versatile += ` + ${finalDamage}`;
          // }
          if (!thisVersatile && dmg[1].trim() == "plus") {
            this.actionInfo.damage.versatile += ` + ${finalDamage}`;
            const part = DDBBasicActivity.buildDamagePart({ damageString: finalDamage, type: dmg[4], stripMod: this.templateType === "weapon" });
            this.actionInfo.damageParts.push({ profBonus, levelBonus, versatile, other, thisOther, thisVersatile, part, includesDice });
          }
        } else {
          const part = DDBBasicActivity.buildDamagePart({ damageString: finalDamage, type: dmg[4], stripMod: this.templateType === "weapon" });
          this.actionInfo.damageParts.push({ profBonus, levelBonus, versatile, other, thisOther, thisVersatile, part, includesDice });
        }
      }
    }

    if (regainMatch) {
      const damageValue = regainMatch[3] ? regainMatch[3] : regainMatch[2];
      const part = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(damageValue, null).diceString,
        type: 'healing',
      });
      this.actionInfo.healingParts.push({ versatile, part });
    }

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

    if (this.actionInfo.damageParts.length > 0 && this.templateType === "weapon") {
      this.actionInfo.damage.base = this.actionInfo.damageParts[0].part;
    } else if (this.templateType !== "weapon" && this.actionInfo.damage.versatile.trim() !== "") {
      const part = DDBBasicActivity.buildDamagePart({ damageString: this.actionInfo.damage.versatile, stripMod: this.templateType === "weapon" });
      this.additionalActivities.push({
        name: `Versatile`,
        options: {
          generateDamage: true,
          damageParts: [part],
          includeBaseDamage: false,
        },
      });
    }

    if (this.actionInfo.formula != "") {
      const part = DDBBasicActivity.buildDamagePart({ damageString: this.actionInfo.formula, stripMod: this.templateType === "weapon" });
      this.additionalActivities.push({
        name: `Other`,
        options: {
          generateDamage: true,
          damageParts: [part],
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
    if (recharge) {
      uses.recovery.push(recharge);
      if (uses.max === null) uses.max = 1;
      uses.spent = 0;
      this.actionInfo.consumptionValue = 1;
    }

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

    // save: {
    //   ability: "",
    //   dc: {
    //     calculation: "",
    //     formula: "",
    //   },
    // },

    if (this.savingThrow) {
      this.actionInfo.save.dc.formula = parseInt(this.savingThrow.groups.dc);
      this.actionInfo.save.dc.calculation = "";
      this.actionInfo.save.ability = this.savingThrow.groups.ability.toLowerCase().substr(0, 3);
    } else if (this.spellSave) {
      // this.actionInfo.save.dc = 10;
      this.actionInfo.save.ability = this.spellSave.groups.ability.toLowerCase().substr(0, 3);
      this.actionInfo.save.dc.calculation = "spellcasting";
    }
    if (this.halfDamage) {
      this.actionInfo.damage.onSave = "half";
      if (this.isAttack) {
        foundry.utils.setProperty(this.data, "flags.midiProperties.otherSaveDamage", "halfdam");
      } else {
        // foundry.utils.setProperty(this.feature, "flags.midiProperties.halfdam", true);
        foundry.utils.setProperty(this.data, "flags.midiProperties.saveDamage", "halfdam");
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

  async #generateDescription() {
    this.html = this.html.replace(/<strong> \.<\/strong>/, "").trim();
    let description = this.hideDescription ? this.#getHiddenDescription() : `${this.html}`;
    description = description.replaceAll("<em><strong></strong></em>", "");
    description = parseDamageRolls({ text: description, document: this.data, actor: this.ddbMonster.npc });
    // description = parseToHitRoll({ text: description, document: this.feature });
    description = parseTags(description);
    this.data.system.description.value = await generateTable(this.ddbMonster.npc.name, description, this.updateExisting);
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

    if (this.templateType !== "feat" && (this.weaponAttack || this.spellAttack)) {
      this.data.system.equipped = true;
    }

    if (this.weaponAttack) {
      if (this.templateType !== "feat") {
        this.data.system.type.value = this.actionInfo.weaponType;
      }
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

    if (this.name.includes("/Day")) {
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
        max: this.actionInfo.uses.max,
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
    const saveActivity = new DDBMonsterFeatureActivity({
      name,
      type: "save",
      ddbParent: this,
      nameIdPrefix: "save",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    saveActivity.build(foundry.utils.mergeObject({
      generateSave: true,
      generateRange: this.templateType !== "weapon",
      includeBaseDamage: this.templateType === "weapon",
      generateDamage: true,
    }, options));

    return saveActivity;
  }

  _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const attackActivity = new DDBMonsterFeatureActivity({
      name,
      type: "attack",
      ddbParent: this,
      nameIdPrefix: "attack",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    const isFlatWeaponDamage = this.templateType === "weapon" && this.actionInfo.damageParts.length > 0
      ? !this.actionInfo.damageParts[0].includesDice
      : false;

    const parts = this.actionInfo.damageParts.length > 1
      ? this.isSave
        ? []
        : this.actionInfo.damageParts.slice(1).map((s) => s.part) // otherwise we assume the weapon attack wants the base damage
      : isFlatWeaponDamage
        ? this.actionInfo.damageParts.map((s) => s.part) // includes no dice, i.e. is flat, we want to ignore the base damage
        : [];

    attackActivity.build(foundry.utils.mergeObject({
      generateAttack: true,
      generateRange: this.templateType !== "weapon",
      generateDamage: !this.isSave,
      includeBaseDamage: this.templateType === "weapon" && !isFlatWeaponDamage,
      damageParts: parts,
    }, options));
    return attackActivity;
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const utilityActivity = new DDBMonsterFeatureActivity({
      name,
      type: "utility",
      ddbParent: this,
      nameIdPrefix: "utility",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    utilityActivity.build(foundry.utils.mergeObject({
      generateRange: this.templateType !== "weapon",
      generateDamage: true,
      includeBaseDamage: this.templateType === "weapon",
    }, options));

    return utilityActivity;
  }

  _getHealActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const healActivity = new DDBMonsterFeatureActivity({
      name,
      type: "heal",
      ddbParent: this,
      nameIdPrefix: "heal",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    healActivity.build(foundry.utils.mergeObject({
      generateDamage: false,
      generateHealing: true,
      generateRange: true,
    }, options));

    return healActivity;
  }

  _getDamageActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const damageActivity = new DDBMonsterFeatureActivity({
      name,
      type: "damage",
      ddbParent: this,
      nameIdPrefix: "damage",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    damageActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: this.templateType !== "weapon",
      generateDamage: true,
      includeBaseDamage: this.templateType === "weapon",
    }, options));
    return damageActivity;
  }

  _getEnchantActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const enchantActivity = new DDBMonsterFeatureActivity({
      name,
      type: "enchant",
      ddbParent: this,
      nameIdPrefix: "enchant",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    enchantActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    }, options));
    return enchantActivity;
  }

  _getSummonActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const summonActivity = new DDBMonsterFeatureActivity({
      name,
      type: "summon",
      ddbParent: this,
      nameIdPrefix: "summon",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    summonActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    }, options));
    return summonActivity;
  }

  _getCheckActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const checkActivity = new DDBMonsterFeatureActivity({
      name,
      type: "check",
      ddbParent: this,
      nameIdPrefix: "check",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    checkActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateCheck: true,
      generateActivation: true,
    }, options));
    return checkActivity;
  }

  #addSaveAdditionalActivity(includeBase = false) {
    this.additionalActivities.push({
      type: "save",
      options: {
        generateDamage: this.actionInfo.damageParts.length > 1,
        damageParts: this.templateType !== "weapon" || includeBase
          ? this.actionInfo.damageParts.map((dp) => dp.part)
          : this.actionInfo.damageParts.slice(1).map((dp) => dp.part),
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
    if (this.healingAction) {
      if (!this.isAttack && !this.isSave && this.actionInfo.damageParts.length === 0) {
        // we generate heal activities as additionals;
        return null;
      }
    }
    if (this.isAttack) {
      // some attacks will have a save and attack
      if (this.isSave) {
        if (this.actionInfo.damageParts.length > 1) {
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

  getActivity({ typeOverride = null, typeFallback = null, name = null, nameIdPostfix = null } = {}, options = {}) {
    const type = typeOverride ?? this._getActivitiesType();
    this.activityTypes.push(type);
    const data = { name, nameIdPostfix };
    switch (type) {
      case "save":
        return this._getSaveActivity(data, options);
      case "attack":
        return this._getAttackActivity(data, options);
      case "damage":
        return this._getDamageActivity(data, options);
      case "heal":
        return this._getHealActivity(data, options);
      case "utility":
        return this._getUtilityActivity(data, options);
      case "enchant":
        return this._getEnchantActivity(data, options);
      case "summon":
        return this._getSummonActivity(data, options);
      case "check":
        return this._getCheckActivity(data, options);
      default:
        if (typeFallback) return this.getActivity({ typeOverride: typeFallback, name, nameIdPostfix }, options);
        return undefined;
    }
  }

  _generateActivity({ hintsOnly = false, name = null, nameIdPostfix = null, typeOverride = null } = {},
    optionsOverride = {},
  ) {
    if (hintsOnly && !this.enricher.activity) return undefined;

    const activity = this.getActivity({
      typeOverride: typeOverride ?? this.enricher.type ?? this.enricher.activity?.type,
      name,
      nameIdPostfix,
    }, optionsOverride);


    if (!activity) return undefined;

    if (!this.activityType) this.activityType = activity.data.type;

    this.enricher.applyActivityOverride(activity.data);
    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;
  }

  _generateAdditionalActivities() {
    if (this.additionalActivities.length === 0) return;
    // console.warn(`ADDITIONAL ITEM ACTIVITIES for ${this.data.name}`, this.additionalActivities);
    this.additionalActivities.forEach((activityData, i) => {
      const id = this._generateActivity({
        hintsOnly: false,
        name: activityData.name,
        nameIdPostfix: i,
        typeOverride: activityData.type,
      }, activityData.options);
      logger.debug(`Generated additional Activity with id ${id}`, {
        this: this,
        activityData,
        id,
      });
    });
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
      this._generateActivity();
      this.#addHealAdditionalActivities();
      this._generateAdditionalActivities();
      this.enricher.addAdditionalActivities(this);
    }

    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.damage", this.actionInfo.damage);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.damageParts", this.actionInfo.damageParts);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.baseAbility", this.actionInfo.baseAbility);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.toHit", this.toHit);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.proficient", this.actionInfo.proficient);
    foundry.utils.setProperty(this.data, "flags.monsterMunch.actionInfo.extraAttackBonus", this.actionInfo.extraAttackBonus);

    await this.#generateDescription();

    this.enricher.addDocumentOverride();
    this.data.system.identifier = utils.referenceNameString(this.data.name.toLowerCase());

    logger.debug(`Parsed Feature ${this.name} for ${this.ddbMonster.name}`, { feature: this });

  }

}
