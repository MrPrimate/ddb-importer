import { logger, utils } from "../../../lib/_module";
import { DDBDescriptions, SystemHelpers } from "../../lib/_module";
import DDBMonsterFeature from "./DDBMonsterFeature";
import { SAVE_OR_RECURRING_DAMAGE_CONTEXT, isDamageTypeChoice, parseMonsterDamageModes } from "./MonsterDamageModes";

// a DAMAGE_EXPRESSION match; the regex uses named groups so `groups` is always present
type TDamageMatch = RegExpExecArray & { groups: NonNullable<RegExpExecArray["groups"]> };

export class DDBMonsterDamage {

  ddbMonsterFeature: DDBMonsterFeature;
  versatile: boolean;
  levelBonus: boolean;
  profBonus: boolean;
  damageParts: IDDBMonsterActionDataDamagePart[];
  healingParts: IDDBMonsterActionDataHealingPart[];
  versatileParts: I5eDamagePart[];
  saveParts: I5eDamagePart[];
  additionalActivities: IAdditionalActivityOutline[];


  // Adjustments
  // removed space in damage detection this might be a problem, for 2024 Summon Construct
  // eslint-disable-next-line no-useless-escape
  static DAMAGE_EXPRESSION = new RegExp(/(?<prefix>(?:takes|saving throw or take\s+)|(?:[\w]*\s+))(?:(?<diceminor>[0-9]+))?(?:\s*\(?(?<dice>[0-9]*d[0-9]+(?:\s*(?:[-+]|plus)\s*(?:[0-9]+|PB|the spell[’']s level))*(?:\s+plus [^\)]+)?)\)?)?\s*(?<type>[\w]*?|[\w]* or [\w]*?)\s*damage(?: when used with | if (?:used|wielded) with )?(?<suffix>\s?two hands|\s?at the start of|\son a failed save)?/gi);

  // "The target gains 10 (3d6) Temporary Hit Points": rolled dice only, as a flat "gains 5 temporary
  // hit points at the start of each of its turns" is a lasting effect, not a roll
  static TEMP_HP_EXPRESSION = /\bgains?\s+(?:\d+\s*)?\((\d+d\d+(?:\s*[-+]\s*\d+)?)\)\s+temporary hit points/i;

  static REGAIN_EXPRESSION = new RegExp(/(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i);
  hit: string;
  splitSaves: boolean;
  templateType: string;
  saves: { type: string | null; hit: string };
  hitsMatch: string[] = [];
  hitMatches: TDamageMatch[] = [];
  damageModes: (IMonsterDamageMode & { damageParts: IDDBMonsterActionDataDamagePart[] })[] = [];
  damageModeWarnings: string[] = [];
  normalHit = "";
  replacesVersatile = false;
  /** The condition of an "or ... damage if X" alternative kept as a Versatile activity. */
  versatileCondition = "";
  /** Hit damage taken on a later turn ("takes 21 (6d6) acid damage at the start of each of its turns"). */
  recurringParts: IDDBMonsterActionDataDamagePart[] = [];
  /** The sentence the recurring damage comes from, and the turn boundary it lands on. */
  recurringCondition = "";
  recurringTiming: "turnStart" | "turnEnd" | "special" = "turnStart";
  #recurringMatches = new Set<TDamageMatch>();

  constructor(hit: string, { ddbMonsterFeature, splitSaves = false } : { ddbMonsterFeature: DDBMonsterFeature; splitSaves?: boolean }) {
    this.hit = hit;

    this.versatile = false;

    this.damageParts = [];
    this.healingParts = [];
    this.versatileParts = [];
    this.saveParts = [];
    this.levelBonus = false;
    this.profBonus = false;
    this.splitSaves = splitSaves;

    this.ddbMonsterFeature = ddbMonsterFeature;
    this.templateType = ddbMonsterFeature.templateType;

    this.saves = {
      type: null,
      hit: "",
    };

    this.additionalActivities = [];
  }


  static damageMatchSave(dmg: Pick<TDamageMatch, "groups">) {
    const savePart1 = dmg.groups.prefix && dmg.groups.prefix.includes("saving throw");
    const savePart5 = (dmg.groups.suffix ?? "").trim() == "on a failed save";
    if ((savePart5 && (dmg.groups.prefix ?? "").trim() !== "and")
        || savePart1
    ) {
      return savePart1 || savePart5;
    }
    return null;
  }

  static _getDamageTypes(text: string, dmgMatch: string): string[] {
    const typesRegex = /damage of a type chosen by the (?:.*?): (.*?)\./i;
    const typesMatch = typesRegex.exec(text);

    const result = new Set<string>();

    const processMatches = ((str: string) => {
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

  _generateHitMatches() {
    const startEndRegex = /At the (start|end) of/ig;
    this.hitsMatch = this.hit.split(startEndRegex);
    const matches = [...this.hitsMatch[0].matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION)] as TDamageMatch[];

    logger.debug(`${this.ddbMonsterFeature.name} Damage matches`, { hit: this.hit, matches, hitsMatch: this.hitsMatch });

    this.hitMatches = matches;
    if (this.hitsMatch.length > 1) {
      this.saves.type = this.hitsMatch[1];
      this.saves.hit = this.hitsMatch[2];
    } else {
      const saveRegex = /(saving throw)/ig;
      this.hitsMatch = this.hit.split(saveRegex);
      const saveMatches = [...this.hitsMatch[0].matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION)] as TDamageMatch[];
      logger.debug(`${this.ddbMonsterFeature.name} Damage matches`, { hit: this.hit, saveMatches, hitsMatch: this.hitsMatch });
      if (this.splitSaves) this.hitMatches = saveMatches;
      this.saves.type = this.hitsMatch[1];
      this.saves.hit = this.hitsMatch[2];
    }
  }

  _getHitMatchDamage(dmg: TDamageMatch) {
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


  _generateHitMatch(dmg: TDamageMatch) {
    let other = false;
    let save = null;
    if (dmg.groups.prefix == "DC " || dmg.groups.type == "hit points by this") {
      return;
    }
    if (DDBDescriptions.damagesObjectsOnly(dmg)) return;
    const after = this.hit.slice((dmg.index ?? 0) + dmg[0].length);
    if (this._mergeDamageTypeChoice(dmg)) return;
    // check for versatile
    if (dmg.groups.prefix == "or " || dmg.groups.suffix == "two hands") {
      this.versatile = true;
      const condition = dmg.groups.prefix == "or "
        ? after.match(/^\s*(?:if|while|when)\s+(.+?)(?=[.;]|,\s*(?:plus|and)\b|$)/i)
        : null;
      if (condition && !this.versatileCondition) this.versatileCondition = condition[1].trim();
    }

    const hasProfBonus = dmg.groups.dice?.includes(" + PB") || dmg.groups.dice?.includes(" plus PB");
    const profBonus = hasProfBonus ? "@prof" : "";
    const levelBonus = dmg.groups.dice ? (/the spell[’']s level/i).test(dmg.groups.dice) : false; // ? "@item.level" : "";

    if (hasProfBonus) this.profBonus = true;
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
    const part = SystemHelpers.buildDamagePart({ damageString: finalDamage, types: damageTypes, stripMod: false });
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
          damageString: finalDamage,
          damageTypes,
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
        damageString: finalDamage,
        damageTypes,
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

  /**
   * "10 (3d6) necrotic damage or (3d6) radiant damage (the son's choice)" is one roll of either
   * type, not an alternative attack: the choice adds its type to the part before it.
   */
  _mergeDamageTypeChoice(dmg: TDamageMatch): boolean {
    const previous = this.damageParts.at(-1);
    if (!previous || !isDamageTypeChoice(this.hit, { ...dmg, index: dmg.index ?? 0 }, previous.damageString)) return false;
    const types = DDBMonsterDamage._getDamageTypes(this.hit, dmg.groups.type) as I5eDamageType[];
    if (types.length === 0) return false;
    previous.damageTypes = [...new Set([...previous.damageTypes, ...types])];
    previous.part.types = [...new Set([...(previous.part.types ?? []), ...types])];
    return true;
  }

  _generateSaveParts(matches: TDamageMatch[]) {
    // a later or triggered roll is the Ongoing Damage activity's, not the failure's
    const later = this.ddbMonsterFeature.isAttack || this.recurringParts.length === 0
      ? new Set<TDamageMatch>()
      : new Set(DDBMonsterDamage.laterRolls(this.saves.hit, matches));
    for (const dmg of matches) {
      if (later.has(dmg)) continue;
      if (DDBDescriptions.damagesObjectsOnly(dmg)) continue;
      const { finalDamage } = this._getHitMatchDamage(dmg);
      if (!finalDamage) continue;
      const damageTypes = DDBMonsterDamage._getDamageTypes(this.saves.hit, dmg.groups.type);
      const part = SystemHelpers.buildDamagePart({
        damageString: finalDamage,
        types: damageTypes,
        stripMod: false,
      });
      this.saveParts.push(part);
    }
  }

  _generateOnStartEndDamage() {
    const allMatches = this.saves.hit.matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION);
    const matches = [...allMatches] as TDamageMatch[];
    logger.debug(`${this.ddbMonsterFeature.name} Start/End Damage matches`, {
      type: this.saves.type?.toLowerCase(),
      hit: this.saves.hit,
      matches,
    });

    this._generateSaveParts(matches);
  }

  _generateOtherSaveDamage() {
    const allMatches = this.saves.hit.matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION);
    const matches = [...allMatches] as TDamageMatch[];
    logger.debug(`${this.ddbMonsterFeature.name} Other Save Damage matches`, {
      type: null,
      hit: this.saves.hit,
      matches,
    });

    this._generateSaveParts(matches);
  }


  /** The healing part of the first "regains 10 (3d6) hit points" in a piece of text, or null. */
  static regainPart(text: string): I5eDamagePart | null {
    const regainMatch = text.match(DDBMonsterDamage.REGAIN_EXPRESSION);
    if (!regainMatch) return null;
    const damageValue = regainMatch[3] ? regainMatch[3] : regainMatch[2];
    return SystemHelpers.buildDamagePart({
      damageString: utils.parseDiceString(damageValue).diceString,
      type: "healing",
    });
  }

  /** The temporary hit point part of the first "gains 10 (3d6) Temporary Hit Points", or null. */
  static tempHpPart(text: string): I5eDamagePart | null {
    const match = DDBMonsterDamage.TEMP_HP_EXPRESSION.exec(text);
    if (!match) return null;
    return SystemHelpers.buildDamagePart({
      damageString: utils.parseDiceString(match[1]).diceString,
      type: "temphp",
    });
  }

  generateRegain() {
    logger.debug(`${this.ddbMonsterFeature.name} Regain matches`, { hit: this.hit });
    const part = DDBMonsterDamage.regainPart(this.hit) ?? DDBMonsterDamage.tempHpPart(this.hit);
    if (part) this.healingParts.push({ versatile: this.versatile, part });
  }

  /**
   * Hit damage whose own clause puts it on a later turn: the roll runs straight into "at the start
   * of" or "at the end of" ("takes 10 (3d6) acid damage at the start of each of its turns"), or is
   * joined by "and"/"plus" to such a roll ("takes 7 (2d6) slashing damage and 7 (2d6) necrotic
   * damage at the start of ..."). A save's damage ("saving throw or take ...") stays with the save.
   * A "the target takes X damage. At the start of ..." rider is in another sentence and is untouched.
   *
   * A save or damage trait keeps its first roll whatever its wording ("takes 20 radiant damage at
   * the start of his turn" is the trait's whole damage); a later roll on a later turn ("Failure: 16
   * (3d10) Bludgeoning damage ... and takes 10 (3d6) Necrotic damage at the start of each of its
   * turns") or behind a trigger ("For 1 minute, whenever the target takes the Magic action, it
   * takes 10 (3d6) Psychic damage") is split out the same way, so the failure does not roll it too.
   */
  /**
   * The rolls of a save or damage trait that land after its first: on a later turn ("and takes 10
   * (3d6) Necrotic damage at the start of each of its turns", "and 12 (5d4) Acid damage at the end
   * of the target's next turn") or behind a trigger ("whenever the target takes the Magic action, it
   * takes 10 (3d6) Psychic damage"). The first roll with a number is the feature's own whatever its
   * wording ("takes 20 radiant damage at the start of its turn" is a trait's whole damage), unless
   * a later-turn clause joins it to another roll; a dice-less "takes fire damage" is the trigger,
   * not a roll.
   */
  static laterRolls(text: string, matches: TDamageMatch[]): TDamageMatch[] {
    const rolled = matches.filter((dmg) => dmg.groups.dice || dmg.groups.diceminor);
    // the expression can take "at the start of" into the match's own suffix
    const turnBound = (dmg: TDamageMatch) => (dmg.groups.suffix ?? "").trim().toLowerCase() === "at the start of"
      || (/^\s*at the (?:start|end) of\b/i).test(text.slice((dmg.index ?? 0) + dmg[0].length));
    const joined = (left: TDamageMatch, right: TDamageMatch) =>
      (/^\s*,?\s*(?:and|plus)\s*$/i).test(text.slice((left.index ?? 0) + left[0].length, right.index) + right.groups.prefix);
    const later = new Set<TDamageMatch>();
    rolled.forEach((dmg, i) => {
      const index = dmg.index ?? 0;
      const sentence = text.slice(text.lastIndexOf(".", index) + 1, index);
      if (i > 0 && (turnBound(dmg) || (/\b(?:whenever|each time)\b/i).test(sentence))) later.add(dmg);
      if (!turnBound(dmg)) return;
      // "takes 28 (8d6) acid damage and 28 (8d6) force damage at the start of ..." is one later-turn
      // clause, even when it holds the feature's first roll (a swallow with no damage of its own)
      let first = i;
      while (first > 0 && joined(rolled[first - 1], rolled[first])) first--;
      if (first < i && (/^(?:takes|take|taking)\b/i).test(rolled[first].groups.prefix.trim())) {
        for (let j = first; j <= i; j++) later.add(rolled[j]);
      }
    });
    return rolled.filter((dmg) => later.has(dmg));
  }

  _findRecurringHitMatches() {
    const recurring = new Set<TDamageMatch>();
    const matches = this.hitMatches;
    if (!this.ddbMonsterFeature.isAttack) {
      for (const dmg of DDBMonsterDamage.laterRolls(this.hit, matches)) {
        if (DDBMonsterDamage.damageMatchSave(dmg) === null) recurring.add(dmg);
      }
      return recurring;
    }
    const joined = (left: TDamageMatch, right: TDamageMatch) =>
      (/^\s*,?\s*(?:and|plus)\s*$/i).test(this.hit.slice((left.index ?? 0) + left[0].length, right.index) + right.groups.prefix);
    for (let i = 0; i < matches.length; i++) {
      const dmg = matches[i];
      if (DDBMonsterDamage.damageMatchSave(dmg) !== null) continue;
      const end = (dmg.index ?? 0) + dmg[0].length;
      const startsTurn = (dmg.groups.suffix ?? "").trim().toLowerCase() === "at the start of"
        || (/^\s*at the (?:start|end) of\b/i).test(this.hit.slice(end));
      if (!startsTurn) continue;
      recurring.add(dmg);
      // "takes X damage and Y damage at the start of ..." is one later-turn clause; "Hit: X damage
      // and Y damage at the end of its next turn" keeps X on the hit
      let first = i;
      while (first > 0 && joined(matches[first - 1], matches[first])) first--;
      if (first < i && (/^(?:takes|take|taking)\b/i).test(matches[first].groups.prefix.trim())) {
        for (let j = first; j < i; j++) recurring.add(matches[j]);
      }
    }
    return recurring;
  }

  _generateRecurringParts() {
    for (const dmg of this.hitMatches) {
      if (!this.#recurringMatches.has(dmg)) continue;
      const { finalDamage, includesDice } = this._getHitMatchDamage(dmg);
      if (!finalDamage) continue;
      const damageTypes = DDBMonsterDamage._getDamageTypes(this.hit, dmg.groups.type) as I5eDamageType[];
      const part = SystemHelpers.buildDamagePart({ damageString: finalDamage, types: damageTypes, stripMod: false });
      this.recurringParts.push({
        damageString: finalDamage, damageTypes, part, includesDice,
        profBonus: finalDamage.includes("@prof") ? "@prof" : "", levelBonus: false,
        versatile: false, other: false, noBonus: part.bonus === "", damageHasMod: finalDamage.includes("@mod"),
      });
    }
    const last = [...this.#recurringMatches].sort((a, b) => (b.index ?? 0) - (a.index ?? 0))[0];
    if (!last) return;
    const index = last.index ?? 0;
    const sentenceStart = Math.max(this.hit.lastIndexOf(".", index), this.hit.lastIndexOf(":", index)) + 1;
    const sentenceEnd = this.hit.indexOf(".", index + last[0].length);
    this.recurringCondition = this.hit.slice(sentenceStart, sentenceEnd < 0 ? undefined : sentenceEnd + 1).trim();
    const boundary = this.hit.slice(index).match(/^[^.]*?at the (start|end) of/i);
    // a roll behind a trigger ("whenever the target takes the Magic action") waits on no turn boundary
    this.recurringTiming = !boundary ? "special" : boundary[1].toLowerCase() === "end" ? "turnEnd" : "turnStart";
  }

  generateDamage() {
    this._generateHitMatches();
    this.#recurringMatches = this._findRecurringHitMatches();
    for (const match of this.hitMatches) {
      if (this.#recurringMatches.has(match)) continue;
      this._generateHitMatch(match);
    }
    this._generateRecurringParts();

    if (["start", "end"].includes(this.saves.type ?? "")) {
      this._generateOnStartEndDamage();
    } else if (this.saves.type) {
      this._generateOtherSaveDamage();
    }

    this._generateDamageModes();
  }

  /** Conditional modes belong to an attack's hit, never a standalone damage trait or save. */
  _generateDamageModes() {
    if (!this.ddbMonsterFeature.isAttack || !(/\bHit:/i).test(this.hit)
      || this.ddbMonsterFeature.enricher?.noVersatile) return;
    // Save and recurring damage stay on the save-damage path: they have no clause model of their
    // own here, and their dice must never move onto a newly generated attack. A type choice ("or
    // (3d6) radiant damage (the son's choice)") was merged into the part before it.
    const tokens = this.hitMatches.filter((match, i) => (match.groups.dice || match.groups.diceminor)
      && !this.#recurringMatches.has(match)
      && !SAVE_OR_RECURRING_DAMAGE_CONTEXT.test(this.hit.slice(0, match.index))
      && !isDamageTypeChoice(this.hit, { ...match, index: match.index ?? 0 },
        this.hitMatches[i - 1]?.groups.dice ?? this.hitMatches[i - 1]?.groups.diceminor));
    const result = parseMonsterDamageModes(this.hit, tokens);
    this.damageModeWarnings = result.warnings;
    if (result.modes.length === 0) return;

    const parts = tokens.map((match): IDDBMonsterActionDataDamagePart | null => {
      const { finalDamage, includesDice } = this._getHitMatchDamage(match);
      if (!finalDamage) return null;
      const damageString = finalDamage.replace(/\s+/g, " ").trim();
      const damageTypes = DDBMonsterDamage._getDamageTypes(this.hit, match.groups.type);
      const part = SystemHelpers.buildDamagePart({ damageString, types: damageTypes,
        stripMod: false });
      return {
        part, damageString, damageTypes, includesDice,
        profBonus: damageString.includes("@prof") ? "@prof" : "",
        levelBonus: (/the spell[’']s level/i).test(match.groups.dice ?? ""),
        versatile: false, other: false, noBonus: part.bonus === "", damageHasMod: damageString.includes("@mod"),
      };
    });
    if (parts.some((part) => part === null)) return;
    const select = (indices: number[]) => indices.map((index) => parts[index]!);
    if (result.versatile.length > 0) {
      // a true two-handed alternative stays the Versatile attack beside the modes
      this.replacesVersatile = false;
      this.versatileParts = select(result.versatile).map((part) => part.part);
      this.versatileCondition = "";
      this.versatile = true;
    } else {
      this.replacesVersatile = this.versatileParts.length > 0;
      this.versatileParts = [];
      this.versatile = false;
    }
    this.damageParts = select(result.normal);
    this.normalHit = result.normalText;
    this.damageModes = result.modes.map((mode) => ({ ...mode, damageParts: select(mode.parts) }));
  }

}
