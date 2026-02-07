import { logger, utils } from "../../lib/_module.mjs";
import { DICTIONARY } from "../../config/_module.mjs";

export default class DDBDescriptions {

  static DEFAULT_DURATION_SECONDS = 60;

  static startOrEnd(text) {
    const re = /at the (start|end) of each/i;
    const match = text.match(re);
    if (match) {
      return match[1];
    } else {
      return undefined;
    }
  }

  static getDuration(text, returnDefault = true, generateSpecial = true) {
    const defaultDurationSeconds = 60;
    const result = {
      type: returnDefault ? "second" : null,
      second: returnDefault ? defaultDurationSeconds : null,
      round: returnDefault ? (defaultDurationSeconds / 6) : null,
      minute: null,
      hour: null,
      special: "",
      value: null,
      units: "inst",
      dae: [],
    };
    const re = /for (\d+) (minute|hour|round|day|month|year)/; // turn|day|month|year
    const match = text.match(re);
    if (match) {
      let seconds = parseInt(match[1]);
      result.type = match[2];
      result.units = match[2];
      result.value = match[1];
      switch (match[2]) {
        case "minute": {
          result.minute = match[1];
          seconds *= 60;
          break;
        }
        case "hour": {
          result.hour = match[1];
          seconds *= 60 * 60;
          break;
        }
        case "round": {
          seconds *= 6;
          result.round = match[1];
          break;
        }
        case "turn": {
          result.turns = match[1];
          break;
        }
        case "day": {
          result.day = match[1];
          seconds *= 60 * 60 * 24;
          break;
        }
        case "year": {
          result.year = match[1];
          seconds *= 60 * 60 * 24 * 365;
          break;
        }
        case "month": {
          result.month = match[1];
          seconds *= 60 * 60 * 24 * 30;
          break;
        }
        // no default
      }

      result.second = seconds;
      return result;
    }


    if (!generateSpecial) return result;

    const smallMatchRe = /until the (?<point>end|start) of (?<whos>its|the target's|your) next turn/ig;
    const smallMatch = smallMatchRe.exec(utils.nameString(text));
    if (smallMatch) {
      result.type = "special";
      result.units = "spec";
      result.second = 6;
      result.round = 1;
      result.special = smallMatch[0];
      // "turnStart" - expires at the start of the targets next turn
      // "turnEnd" - expires at the end of the targets next turn
      // "turnStartSource" - expires at the start of the source actors next turn
      // "turnEndSource" - expires at the end of the source actors next turn
      // "combatEnd" - expires at the end of combat
      // "joinCombat" - expires at the start of combat
      result.dae = [];
      if (["its", "the target's"].includes(smallMatch.groups.whos)) {
        result.dae.push(`turn${utils.capitalize(smallMatch.groups.point)}`);
      } else if (["your"].includes(smallMatch.groups.whos)) {
        result.dae.push(`turn${utils.capitalize(smallMatch.groups.point)}Source`);
      }

      return result;
    }
    return result;
  }

  static addSpecialDurationFlagsToEffect(effect, match) {
    const durations = [];
    // minutes
    if (match[7]
      && (match[7].includes("until the end of its next turn")
      || match[7].includes("until the end of the target's next turn"))
    ) {
      durations.push("turnEnd");
    } else if (match[7] && match[7].includes("until the start of the")) {
      durations.push("turnStartSource");
    }

    const currentSpecialDurations = foundry.utils.getProperty(effect, "flags.dae.specialDuration") ?? [];
    const specialDurations = utils.addArrayToProperties(currentSpecialDurations, durations ?? []);
    foundry.utils.setProperty(effect, "flags.dae.specialDuration", specialDurations);
    return effect;
  }

  static getRiderStatusEffects({ text, condition } = {}) {
    const checkReg = new RegExp(`While ${condition}, the target has the (.*) condition`, "i");
    const match = checkReg.exec(text);
    if (match) {
      const processedCondition = DDBDescriptions.getConditionInfo(match[1]);
      return [processedCondition.condition];
    }
    return [];
  }

  // A selection of example conditions
  // DC 18 Strength saving throw or be knocked prone
  // DC 14 Constitution saving throw or become poisoned for 1 minute.
  // DC 12 Constitution saving throw or be poisoned for 1 minute
  // DC 15 Wisdom saving throw or be frightened until the end of its next turn.
  // DC 15 Charisma saving throw or be charmed
  // DC 12 Charisma saving throw or become cursed
  // DC 10 Intelligence saving throw or it can’t take a reaction until the end of its next turn
  // DC 12 Constitution saving throw or contract bluerot
  // DC 17 Strength saving throw or be thrown up to 30 feet away in a straight line
  // DC 13 Constitution saving throw or lose the ability to use reactions until the start of the weird’s
  // DC 16 Wisdom saving throw or move 1 round forward in time
  // DC 15 Constitution saving throw, or for 1 minute, its speed is reduced by 10 feet; it can take either an action or a bonus action on each of its turns, not both; and it can’t take reactions.
  // DC 15 Constitution saving throw or have disadvantage on its attack rolls until the end of its next turn
  // DC 15 Wisdom saving throw or be frightened until the end of its next turn
  // DC 13 Strength saving throw or take an extra 3 (1d6) piercing damage and be grappled (escape DC 13)
  // DC 15 Constitution saving throw or gain 1 level of exhaustion
  // DC 20 Constitution saving throw or be paralyzed for 1 minute
  // DC 17 Constitution saving throw or be cursed with loup garou lycanthropy
  // DC 12 Constitution saving throw or be cursed with mummy rot
  // DC 18 Strength saving throw or be swallowed by the neothelid. A swallowed creature is blinded and restrained, it has total cover against attacks and other effects outside the neothelid, and it takes 35 (10d6) acid damage at the start of each of the neothelid’s turns.</p><p>If the neothelid takes 30 damage or more on a single turn from a creature inside it, the neothelid must succeed on a DC 18 Constitution saving throw at the end of that turn or regurgitate all swallowed creatures, which fall prone in a space within 10 feet of the neothelid. If the neothelid dies, a swallowed creature is no longer restrained by it and can escape from the corpse by using 20 feet of movement, exiting prone.
  // (before DC) it can’t regain hit points for 1 minute
  // DC 14 Dexterity saving throw or suffer one additional effect of the shadow dancer’s choice:</p><ul>\n<li>The target is grappled (escape DC 14) if it is a Medium or smaller creature. Until the grapple ends, the target is restrained, and the shadow dancer can’t grapple another target.</li>\n<li>The target is knocked prone.</li>\n<li>The target takes 22 (4d10) necrotic damage.</li>\n</ul>\n</section>\nThe Shadow Dancer attacks with its Spiked Chain.
  // DC 15 Constitution saving throw or be stunned until the end of its next turn.
  // DC 15 Constitution saving throw or die.
  // DC 20 Strength saving throw or be pulled up to 25 feet toward the balor.
  // DC 11 Constitution saving throw or be poisoned until the end of the target’s next turn.
  // DC 14 Wisdom saving throw or be frightened of the quori for 1 minute.
  // DC 13 Constitution saving throw or be poisoned for 1 hour. If the saving throw fails by 5 or more, the target is also unconscious while poisoned in this way. The target wakes up if it takes damage or if another creature takes an action to shake it awake.


  // eslint-disable-next-line complexity
  static dcParser({ text } = {}) {
    const results = {
      save: {
        dc: {
          formula: "",
          calculation: "",
        },
        ability: null,
      },
      match: null,
      damageAndSave: false,
      duration: {
        type: null,
        value: null,
      },
      damage: {
        type: null,
        value: null,
      },
      riderStatuses: [],
    };

    let parserText = utils.nameString(text)
      .replaceAll("[condition]", "")
      .replaceAll("[/condition]", "")
      .replaceAll("[save]", "")
      .replaceAll("[/save]", "")
      .replaceAll("[/action]", "")
      .replaceAll("[action]", "");
    const conditionSearch = /\[\[\/save (?<ability>\w+) (?<dc>\d\d) format=long\]\](?:,)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?:&(?:amp;)?Reference\[(?<condition>\w+)\]{\w+})?\s?(?:for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?(.*)??(?:.|$)/ig;
    let match = conditionSearch.exec(parserText);
    if (!match) {
      const rawConditionSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)(?:,)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?(.*)??(?:.|$)/ig;
      match = rawConditionSearch.exec(parserText);
    }

    if (!match) {
      const rawNoDC = /(?<ability>\w+)? (?<type>saving throw|check)(?:,)? or (?<hint>have the|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (\d+)\s?(?<durationType>minute|round|hour)| until)?(.*)??(?:.|$)/ig;
      match = rawNoDC.exec(parserText);
    }

    if (!match) {
      const rawDamageConditionSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)(?:,| against this magic)? or take (?<fixed>\d+) \((?<damageValue>\d+d\d+)\) (?<damageType>\w+) damage and (?<hint>have the|then be|be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(?<condition>\w+)?\s?(?:for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?(.*)?(?:.|$)/ig;
      match = rawDamageConditionSearch.exec(parserText);
      if (match) {
        results.damageAndSave = true;
        results.damage = {
          type: match.groups.damageType.trim(),
          value: match.groups.damageValue.trim(),
        };
      }
    }

    if (!match) {
      const rawConditionSearch2 = /(?<ability>\w+) (?<type>saving throw|check): DC (?<dc>\d+)(?:[ .,])(.*)Failure: The target has the (?<condition>\w+)(?: for (?<durationUnits>\d+) (?<durationType>minute|round|hour)| until)?/ig;
      match = rawConditionSearch2.exec(parserText);
    }

    if (!match) {
      const monsterAndCondition = /(the target has the|subject that creature to the|it has the) (?<condition>\w+) condition/ig;
      match = monsterAndCondition.exec(parserText);
    }

    if (!match) {
      const onHitSearch = /On a hit, the target is (?<condition>\w+)? until/ig;
      match = onHitSearch.exec(parserText);
    }

    if (!match) {
      const saveSearch = /On a failed save, a creature takes (\d+)?d(\d+) (\w+) damage and is (?<condition>\w+)(?: for (?<durationUnits>\d+) (?<durationType>minute|round|hour))?/ig;
      match = saveSearch.exec(parserText);
    }

    if (!match) {
      const saveSearch = /On a failed save, (?:a|the) creature takes (\d+)?d(\d+) (\w+) damage and has the (?<condition>\w+) condition until the (?<specialDuration>\w+) of your next turn/ig;
      match = saveSearch.exec(parserText);
    }

    if (!match) {
      const successSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check) \(DC 8 plus your (?<modifier>\w+) modifier and Proficiency Bonus\) or (?:have the) (?<condition>\w+) condition until /ig;
      match = successSearch.exec(parserText);
    }

    if (!match) {
      const successSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check)(?: \(DC equal to 8 \+ your proficiency bonus \+ your (?<modifier>\w+) modifier\))? or (?:be|become) (?<condition>\w+) (of you )?until /ig;
      match = successSearch.exec(parserText);
    }

    if (!match) {
      const snippetSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check) \(DC {{savedc:(?<modifier>\w+)}}\)? or be (?<condition>\w+) until/ig;
      match = snippetSearch.exec(parserText);
    }

    if (!match) {
      const spellcasterSearch = /a (?<ability>\w+) (?<type>saving throw|check) against your (?<spellcasting>spell save DC|spellcasting|spell casting)/ig;
      match = spellcasterSearch.exec(parserText);
    }

    if (!match) {
      const paladinMatch = /a (?<ability>\w+) (?<type>saving throw|check). On a failed save, a creature becomes (?<condition>\w+)(?: of|.| )/ig;
      match = paladinMatch.exec(parserText);
    }

    if (!match) {
      const paladinMatch2 = /a (?<ability>\w+) (?<type>saving throw|check). On a failed save, the attacker/ig;
      match = paladinMatch2.exec(parserText);
    }

    if (match) {
      if (match.groups.type === "check") results.check = true;
      results.save = {
        dc: {
          formulas: match.groups["dc"] ?? "",
          calculation: match.groups["spellcasting"] ? "spellcasting" : (match.groups["modifier"]?.toLowerCase().substr(0, 3) ?? ""),
        },
        ability: match.groups["ability"]?.toLowerCase().substr(0, 3) ?? "",
      };
      if (results.save.dc.calculation === "" && results.save.dc.formulas === "") {
        if (parserText.toLowerCase().includes("channel divinity)")) {
          results.save.dc.calculation = "spellcasting";
        }
      }
    }

    if (match && match.groups["condition"]) {
      results.riderStatuses = DDBDescriptions.getRiderStatusEffects({
        text,
        condition: match.groups["condition"],
      });
    }

    results.match = match;

    if (match?.groups.durationUnits) {
      results.duration.units = match.groups.durationUnits.trim();
    }
    if (match?.groups.durationType) {
      results.duration.type = match.groups.durationType.trim();
    }

    return results;
  }

  static getConditionInfo(condition, hint) {
    const result = {
      success: true,
      condition: null,
      group4: null,
      group4Condition: null,
      conditionName: utils.capitalize(condition),
    };
    result.condition = condition.toLowerCase();
    // group 4 condition - .e.g. "DC 18 Strength saving throw or be knocked prone"
    const group4Condition = condition
      ? DICTIONARY.actor.damageAdjustments
        .filter((type) => type.type === 4)
        .find(
          (type) => type.name.toLowerCase() === condition.toLowerCase()
            || type.foundryValue === condition.toLowerCase(),
        )
      : undefined;
    if (group4Condition) {
      result.condition = group4Condition.foundryValue;
      result.group4 = true;
      result.group4Condition = group4Condition;
      result.conditionName = group4Condition.name;
    } else if (hint === "die") {
      result.condition = "dead";
      result.conditionName = "Dead";
    } else {
      result.success = false;
      logger.debug(`Odd condition ${condition} found`);
    }
    return result;
  }

  static parseStatusCondition({ text } = {}) {
    const result = {
      success: false,
      check: false,
      save: {
        dc: {
          formula: "",
          calculation: "",
        },
        ability: null,
      },
      condition: null,
      group4: null,
      group4Condition: null,
      conditionName: null,
      duration: {
        seconds: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      },
      specialDurations: [],
      match: null,
      riderStatuses: [],
    };

    let parserText = utils.nameString(text);
    const matchResults = DDBDescriptions.dcParser({ text: parserText });

    // console.warn("condition status", match);
    if (matchResults.match) {
      const match = matchResults.match;
      result.match = match;
      if (match.groups.type === "check") result.check = true;
      result.save = matchResults.save;

      result.condition = match.groups["condition"];

      if (!result.condition) {
        logger.debug(`Not condition found`, {
          text,
        });
        return result;
      }

      const parsedCondition = DDBDescriptions.getConditionInfo(match.groups["condition"], match.groups.hint);
      // console.warn({parsedCondition, matchResults});
      if (parsedCondition.success) {
        result.condition = parsedCondition.condition;
        result.conditionName = parsedCondition.conditionName;
        result.group4 = parsedCondition.group4;
        // group 4 condition - .e.g. "DC 18 Strength saving throw or be knocked prone"
        result.group4Condition = parsedCondition.group4Condition;
      } else {
        logger.debug(`Odd condition ${result.condition} found`, {
          text,
        });
        return result;
      }

      result.success = true;
      const duration = DDBDescriptions.getDuration(parserText);

      if (duration.type) {
        result.duration = {
          seconds: duration.second,
          rounds: duration.round,
        };
      }
      result.specialDurations = duration.dae ?? [];
    }

    result.riderStatuses = matchResults.riderStatuses;

    return result;
  }


  // eslint-disable-next-line complexity
  static featureBasics({ text } = {}) {

    const standardMatchRegex = /(?<range>Melee|Ranged|Melee\s+or\s+Ranged)\s+(?<type>|Weapon|Spell)\s*(?<attackRoll>Attack|Attack Roll):\s*(?<bonus>[+-]\d+|your (?:\w+\s*)*)\s*(?<pb>plus PB\s|\+ PB\s)?(?:to\s+hit|,|\(|\.)/i;
    const standardAttackMatches = standardMatchRegex.exec(text);
    const summonAttackRegex = /(?<range>Melee|Ranged|Melee\s+or\s+Ranged)\s+(?<type>|Weapon|Spell)\s*(?<attackRoll>Attack|Attack Roll):\s*(?<spellAttackMod>Bonus equals your spell attack modifier)/i;
    const summonAttackMatches = summonAttackRegex.exec(text);

    const match = standardAttackMatches ?? summonAttackMatches;
    const weaponAttack = match
      ? (match.groups.type.toLowerCase() === "weapon" || match.groups.type === "")
      : false;

    const spellAttack = match ? match.groups.type.toLowerCase() === "spell" : false;
    const meleeAttack = match ? match.groups.range.includes("Melee") : false;
    const rangedAttack = match ? match.groups.range.includes("Ranged") : false;

    const pbToAttack = standardAttackMatches ? standardAttackMatches.groups.pb !== undefined : false;
    const yourSpellAttackModToHit = standardAttackMatches?.groups?.bonus?.startsWith("your spell")
      ?? Boolean(summonAttackMatches?.groups?.spellAttackMod);

    const toHit = standardAttackMatches
      ? Number.isInteger(parseInt(standardAttackMatches.groups.bonus))
        ? parseInt(standardAttackMatches.groups.bonus)
        : 0
      : 0;

    const isSummonAttack = summonAttackMatches
      ? summonAttackMatches.groups.range !== undefined
      : false;

    const isAttack = isSummonAttack
      ? true
      : standardAttackMatches
        ? standardAttackMatches.groups.range !== undefined
        : false;

    const save = {
      ability: "",
      dc: {
        calculation: "",
        formula: "",
      },
      half: false,
    };

    const spellSaveSearch = /(?<ability>\w+) saving throw against your spell save DC/i;
    const spellSave = text.match(spellSaveSearch);
    const summonSaveSearc = /(?<ability>\w+) Saving Throw: DC equals your spell save DC/i;
    const summonSave = text.match(summonSaveSearc);

    const saveSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)/i;
    const saveSearchMatch = text.match(saveSearch);
    const saveSearchNew = /(?<ability>\w+) (?<type>saving throw|check): DC (?<dc>\d+)/i;
    const saveSearchNewMatch = text.match(saveSearchNew);

    const savingThrow = saveSearchMatch ?? saveSearchNewMatch;
    const halfSaveSearch = /or half as much damage on a successful one|Success: Half damage/i;
    const halfMatch = halfSaveSearch.test(text);
    if (halfMatch) save.half = true;

    if (savingThrow) {
      save.dc.formula = parseInt(savingThrow.groups.dc);
      save.dc.calculation = "";
      save.ability = savingThrow.groups.ability.toLowerCase().substr(0, 3);
    } else if (spellSave || summonSave) {
      // save.dc = 10;
      save.ability = spellSave
        ? [spellSave.groups.ability.toLowerCase().substr(0, 3)]
        : [summonSave.groups.ability.toLowerCase().substr(0, 3)];
      save.dc.calculation = "spellcasting";
    }

    const healingRegex = /(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i;
    const healingMatch = healingRegex.test(text);

    const result = {
      matches: {
        attackMatches: standardAttackMatches,
        summonAttackMatches,
        healingMatch,
        spellSave,
        saveSearchMatch,
        saveSearchNewMatch,
        halfMatch,
      },
      save,
      midiProperties: isAttack
        ? { otherSaveDamage: "halfdam" }
        : { saveDamage: "halfdam" },
      properties: {
        isAttack,
        isSummonAttack,
        spellSave,
        savingThrow,
        summonSave,
        isSave: Boolean(spellSave || savingThrow || summonSave),
        halfDamage: halfMatch,
        pbToAttack,
        weaponAttack,
        spellAttack,
        meleeAttack,
        rangedAttack,
        healingAction: healingMatch,
        toHit,
        yourSpellAttackModToHit,
      },
    };

    return result;
  }

  static splitStringByComma(str) {
    // Regular expression to match commas not inside brackets
    const regex = /,(?![^(]*\))/g;
    const result = str.split(regex);
    return result.map((item) => item.replaceAll("*", "").trim().replace(/\.$/, ""));
  }

  static parseOutMonsterSpells(text) {
    const results = [];

    const processSpell = (spellName) => {
      const extraCheckRegex = /(.*)\((.*)\)/i;
      const extraMatch = extraCheckRegex.exec(spellName.trim());

      let level = null;
      let targetSelf = null;
      let duration = null;
      const extras = [];

      if (extraMatch) {
        for (const extra of extraMatch[2].split(",")) {
          const levelRegex = /level (\d) version/i;
          const levelMatch = levelRegex.exec(extra);
          if (levelMatch) level = levelMatch[1];
          const targetSelfRegex = /(self only|on itself)/i;
          const targetSelfMatch = targetSelfRegex.exec(extra);
          if (targetSelfMatch) targetSelf = true;
          const durationRegex = /(\d+)-(\w+) duration/i;
          const durationMatch = durationRegex.exec(extra);
          if (durationMatch) {
            duration = {
              override: true,
              value: durationMatch[1],
              units: durationMatch[2],
            };
          }
          if (!levelMatch) {
            extras.push(extra.trim());
          }
        }
      }
      return {
        name: extraMatch ? extraMatch[1].trim() : spellName.trim(),
        level,
        extra: extras.length > 0 ? extras.join(", ") : null,
        targetSelf,
        duration,
      };
    };

    // 3/day each: charm person (level 5 version), color spray, detect thoughts, hold person (level 3 version)
    const innateSearch = /^(\d+)\/(\w+)(?:\s+each)?:\s+(.*$)/i;
    const innateMatch = text.match(innateSearch);

    // console.warn(innateMatch);
    if (innateMatch) {
      DDBDescriptions.splitStringByComma(innateMatch[3]).forEach((spell) => {
        const data = processSpell(spell);
        results.push(foundry.utils.mergeObject(data, {
          period: innateMatch[2],
          quantity: innateMatch[1],
        }));
      });
    }

    // At will: dancing lights
    const atWillSearch = /^at will:\s+(.*$)/i;
    const atWillMatch = text.match(atWillSearch);
    // console.warn(atWillMatch);
    if (atWillMatch) {
      DDBDescriptions.splitStringByComma(atWillMatch[1]).forEach((spell) => {
        results.push(processSpell(spell));
      });
    }

    return results;
  };

}
