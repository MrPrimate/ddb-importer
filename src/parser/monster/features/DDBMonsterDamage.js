import { logger, utils } from "../../../lib/_module.mjs";
import { SystemHelpers } from "../../lib/_module.mjs";

export class DDBMonsterDamage {

  // Adjustments
  // removed space in damage detection this might be a problem, for 2024 Summon Construct
  // eslint-disable-next-line no-useless-escape
  static DAMAGE_EXPRESSION = new RegExp(/(?<prefix>(?:takes|saving throw or take\s+)|(?:[\w]*\s+))(?:(?<diceminor>[0-9]+))?(?:\s*\(?(?<dice>[0-9]*d[0-9]+(?:\s*(?:[-+]|plus)\s*(?:[0-9]+|PB|the spell[’']s level))*(?:\s+plus [^\)]+)?)\)?)?\s*(?<type>[\w]*?|[\w]* or [\w]*?)\s*damage(?: when used with | if (?:used|wielded) with )?(?<suffix>\s?two hands|\s?at the start of|\son a failed save)?/gi);

  static REGAIN_EXPRESSION = new RegExp(/(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i);

  constructor(hit, { ddbMonsterFeature } = {}) {
    this.hit = hit;

    this.versatile = false;

    this.damageParts = [];
    this.healingParts = [];
    this.versatileParts = [];
    this.saveParts = [];
    this.levelBonus = false;

    this.ddbMonsterFeature = ddbMonsterFeature;
    this.templateType = ddbMonsterFeature.templateType;

    this.saves = {
      type: null,
      hit: "",
    };

    this.additionalActivities = [];
  }


  static damageMatchSave(dmg) {
    const savePart1 = dmg.groups.prefix && dmg.groups.prefix.includes("saving throw");
    const savePart5 = (dmg.groups.suffix ?? "").trim() == "on a failed save";
    if ((savePart5 && (dmg.groups.prefix ?? "").trim() !== "and")
        || savePart1
    ) {
      return savePart1 || savePart5;
    }
    return null;
  }

  static _getDamageTypes(text, dmgMatch) {
    const typesRegex = /damage of a type chosen by the (?:.*?): (.*?)\./i;
    const typesMatch = typesRegex.exec(text);

    const result = new Set();

    const processMatches = ((str) => {
      const matches = str.replace(", or ", ",").replace(" or ", ",").split(",").map((d) => d.trim().toLowerCase());

      for (const match of matches) {
        if (match.trim() !== "" && Object.keys(CONFIG.DND5E.damageTypes).includes(match.trim().toLowerCase())) {
          result.add(match.trim().toLowerCase());
        }
      }
    });

    if (dmgMatch && dmgMatch.trim() !== "") {
      processMatches(dmgMatch);
    }

    if (typesMatch && result.size === 0) {
      processMatches(typesMatch[1]);
    }

    return Array.from(result);
  }

  damageModReplace(text) {
    let result;
    const diceParse = utils.parseDiceString(text, null);
    if (this.baseAbility) {
      const baseAbilityMod = this.ddbMonster.abilities[this.actionData.baseAbility].mod;
      const bonusMod = (diceParse.bonus && diceParse.bonus !== 0) ? diceParse.bonus - baseAbilityMod : "";
      const useMod = (diceParse.bonus && diceParse.bonus !== 0) ? " + @mod " : "";
      const reParse = utils.diceStringResultBuild(diceParse.diceMap, diceParse.dice, bonusMod, useMod);
      result = reParse.diceString;
    } else {
      result = diceParse.diceString;
    }

    return result;
  }


  _generateHitMatches() {
    const startEndRegex = /At the (start|end) of/ig;
    this.hitsMatch = this.hit.split(startEndRegex);
    const matches = [...this.hitsMatch[0].matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION)];

    logger.debug(`${this.ddbMonsterFeature.name} Damage matches`, { hit: this.hit, matches, hitsMatch: this.hitsMatch });

    this.hitMatches = matches;
    if (this.hitsMatch.length > 1) {
      this.saves.type = this.hitsMatch[1];
      this.saves.hit = this.hitsMatch[2];
    } else {
      const saveRegex = /(saving throw)/ig;
      this.hitsMatch = this.hit.split(saveRegex);
      const saveMatches = [...this.hitsMatch[0].matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION)];
      logger.debug(`${this.ddbMonsterFeature.name} Damage matches`, { hit: this.hit, saveMatches, hitsMatch: this.hitsMatch });
      this.saves.type = this.hitsMatch[1];
      this.saves.hit = this.hitsMatch[2];
    }
  }

  _getHitMatchDamage(dmg) {
    let damage;

    const hasProfBonus = dmg.groups.dice?.includes(" + PB") || dmg.groups.dice?.includes(" plus PB");
    const profBonus = hasProfBonus ? "@prof" : "";
    const levelBonus = dmg.groups.dice && (/the spell[’']s level/i).test(dmg.groups.dice); // ? "@item.level" : "";


    if (hasProfBonus || levelBonus) {
      damage = `${dmg.groups.diceminor}${dmg.groups.dice.replace(" + PB", "").replace(" plus PB", "").replace(" + the spell’s level", "").replace(" + the spell's level", "")}`;
    } else if (dmg.groups.dice && dmg.groups.dice.startsWith("d") && dmg.groups.diceminor) {
      // tweaked for Aberrant Spirit (Mind Flayer)
      damage = `${dmg.groups.diceminor}${dmg.groups.dice}`;
    } else {
      damage = dmg.groups.dice ?? dmg.groups.diceminor;
    }

    // Make sure we did match a damage
    if (!damage) return { finalDamage: null, includesDice: false };

    const includesDiceRegExp = /[0-9]*d[0-9]+/;
    const includesDice = includesDiceRegExp.test(damage);
    const parsedDiceDamage = (this.ddbMonsterFeature.actionData && includesDice)
      ? this.ddbMonsterFeature.damageModReplace(damage.replace("plus", "+"))
      : damage.replace("plus", "+");

    const finalDamage = [parsedDiceDamage, profBonus].filter((t) => t !== "").join(" + ");

    return { finalDamage, includesDice };
  }


  _generateHitMatch(dmg) {
    let other = false;
    let save = null;
    if (dmg.groups.prefix == "DC " || dmg.groups.type == "hit points by this") {
      return;
    }
    // check for versatile
    if (dmg.groups.prefix == "or " || dmg.groups.suffix == "two hands") {
      this.versatile = true;
    }

    const hasProfBonus = dmg.groups.dice?.includes(" + PB") || dmg.groups.dice?.includes(" plus PB");
    const profBonus = hasProfBonus ? "@prof" : "";
    const levelBonus = dmg.groups.dice && (/the spell[’']s level/i).test(dmg.groups.dice); // ? "@item.level" : "";

    if (levelBonus) this.levelBonus = true;
    const { includesDice, finalDamage } = this._getHitMatchDamage(dmg);

    if (!finalDamage) return;
    const damageHasMod = finalDamage.includes("@mod");
    const damageTypes = DDBMonsterDamage._getDamageTypes(this.hit, dmg.groups.type);

    // console.warn("MODS", {
    //   parsedDiceDamage,
    //   finalDamage,
    //   damageHasMod,
    // })

    // if this is a save based attack, and multiple damage entries, we assume any entry beyond the first is going into
    // versatile for damage
    // ignore if dmg.groups.prefix is and as it likely indicates the whole thing is a save
    const hasSave = DDBMonsterDamage.damageMatchSave(dmg);
    if (hasSave !== null && this.damageParts.length >= 1) {
      save = hasSave;
      other = true;
    }
    const part = SystemHelpers.buildDamagePart({ damageString: finalDamage, types: damageTypes, stripMod: this.templateType === "weapon" });
    // assumption here is that there is just one field added to versatile. this is going to be rare.
    if (other) {
      this.additionalActivities.push({
        name: save ? "Save vs" : "Damage",
        type: save ? "save" : "damage",
        options: {
          generateDamage: true,
          damageParts: [part],
          includeBaseDamage: false,
        },
      });
    } else if (this.versatile) {
      if (this.versatileParts.length === 0) this.versatileParts.push(part);
      // so things like the duergar mind master have oddity where we might want to use a different thing
      // } else {
      //   result.damage.versatile += ` + ${finalDamage}`;
      // }
      if (dmg.groups.prefix.trim() == "plus") {
        this.versatileParts.push(part);
        this.damageParts.push({
          profBonus,
          levelBonus,
          versatile: this.versatile,
          other,
          part,
          includesDice,
          noBonus: part.bonus === "",
          damageHasMod,
        });
      }
    } else {
      this.damageParts.push({
        profBonus,
        levelBonus,
        versatile: this.versatile,
        other,
        part,
        includesDice,
        noBonus: part.bonus === "",
        damageHasMod,
      });
    }
  }

  _generateSaveParts(matches) {
    for (const dmg of matches) {
      const { finalDamage } = this._getHitMatchDamage(dmg);
      if (!finalDamage) continue;
      const damageTypes = DDBMonsterDamage._getDamageTypes(this.saves.hit, dmg.groups.type);
      const part = SystemHelpers.buildDamagePart({
        damageString: finalDamage,
        types: damageTypes,
        stripMod: this.templateType === "weapon",
      });
      this.saveParts.push(part);
    }
  }

  _generateOnStartEndDamage() {
    const allMatches = this.saves.hit.matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION);
    const matches = [...allMatches];
    logger.debug(`${this.ddbMonsterFeature.name} Start/End Damage matches`, {
      type: this.saves.type.toLowerCase(),
      hit: this.saves.hit,
      matches,
    });

    this._generateSaveParts(matches);
  }

  _generateOtherSaveDamage() {
    const allMatches = this.saves.hit.matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION);
    const matches = [...allMatches];
    logger.debug(`${this.ddbMonsterFeature.name} Other Save Damage matches`, {
      type: null,
      hit: this.saves.hit,
      matches,
    });

    this._generateSaveParts(matches);
  }


  generateRegain() {
    const regainMatch = this.hit.match(DDBMonsterDamage.REGAIN_EXPRESSION);

    logger.debug(`${this.ddbMonsterFeature.name} Regain matches`, { hit: this.hit, regainMatch });

    if (regainMatch) {
      const damageValue = regainMatch[3] ? regainMatch[3] : regainMatch[2];
      const part = SystemHelpers.buildDamagePart({
        damageString: utils.parseDiceString(damageValue, null).diceString,
        type: 'healing',
      });
      this.healingParts.push({ versatile: this.versatile, part });
    }
  }

  generateDamage() {
    this._generateHitMatches();
    for (const match of this.hitMatches) {
      this._generateHitMatch(match);
    }

    if (["start", "end"].includes(this.saves.type)) {
      this._generateOnStartEndDamage();
    } else if (this.saves.type) {
      this._generateOtherSaveDamage();
    }
  }

}
