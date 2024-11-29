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
      const monsterAndCondition = /(the target has the|subject that creature to the) (?<condition>\w+) condition/ig;
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
      const successSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check)(?: \(DC equal to 8 \+ your proficiency bonus \+ your (?<modifier>\w+) modifier\))? or (?:be|become) (?<condition>\w+) (of you )?until /ig;
      match = successSearch.exec(parserText);
    }

    if (!match) {
      const snipetSearch = /succeed on a (?<ability>\w+) (?<type>saving throw|check) \(DC {{savedc:(?<modifier>\w+)}}\)? or be (?<condition>\w+) until/ig;
      match = snipetSearch.exec(parserText);
    }

    if (!match) {
      const spellcasterSearch = /a (?<ability>\w+) (?<type>saving throw|check) against your (?<spellcasting>spell save DC|spellcasting|spell casting)/ig;
      match = spellcasterSearch.exec(parserText);
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
      duration: {
        seconds: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      },
      specialDurations: [],
      match: null,
    };

    let parserText = utils.nameString(text);
    const matchResults = DDBDescriptions.dcParser({ text: parserText });

    // console.warn("condition status", match);
    if (matchResults.match) {
      const match = matchResults.match;
      result.match = match;
      if (match.groups.type === "check") result.check = true;
      result.condition = match.groups["condition"];

      result.save = matchResults.save;
      // group 4 condition - .e.g. "DC 18 Strength saving throw or be knocked prone"
      const group4Condition = match.groups.condition
        ? DICTIONARY.character.damageAdjustments
          .filter((type) => type.type === 4)
          .find(
            (type) => type.name.toLowerCase() === match.groups.condition.toLowerCase()
              || type.foundryValue === match.groups.condition.toLowerCase(),
          )
        : undefined;
      if (group4Condition) {
        result.condition = group4Condition.value;
        result.group4 = true;
        result.group4Condition = group4Condition.name;
      } else if (match.groups.hint && match.groups.hint === "die") {
        result.condition = "dead";
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

    return result;
  }


  static featureBasics({ text } = {}) {

    const attackMatches = text.match(
      /(?<range>Melee|Ranged|Melee\s+or\s+Ranged)\s+(?<type>|Weapon|Spell)\s*(?<attackRoll>Attack|Attack Roll):\s*(?<bonus>[+-]\d+|your (?:\w+\s*)*)\s*(?<pb>plus PB\s|\+ PB\s)?(?:to\s+hit|,|\(|\.)/i,
    );


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

    const saveSearch = /DC (?<dc>\d+) (?<ability>\w+) (?<type>saving throw|check)/i;
    const saveSearchMatch = text.match(saveSearch);
    const saveSearchNew = /(?<ability>\w+) (?<type>saving throw|check): DC (?<dc>\d+)/i;
    const saveSearchNewMatch = text.match(saveSearchNew);
    const savingThrow = saveSearchMatch ?? saveSearchNewMatch;

    const halfSaveSearch = /or half as much damage on a successful one|Success: Half damage/i;
    const halfMatch = halfSaveSearch.test(text);

    if (savingThrow) {
      save.dc.formula = parseInt(savingThrow.groups.dc);
      save.dc.calculation = "";
      save.ability = savingThrow.groups.ability.toLowerCase().substr(0, 3);
    } else if (spellSave) {
      // save.dc = 10;
      save.ability = [spellSave.groups.ability.toLowerCase().substr(0, 3)];
      save.dc.calculation = "spellcasting";
    }

    const isAttack = attackMatches ? attackMatches.groups.range !== undefined : false;

    const healingRegex = /(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9]*d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i;
    const healingMatch = healingRegex.test(text);

    const result = {
      matches: {
        attackMatches,
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
        spellSave,
        savingThrow,
        isSave: Boolean(spellSave || savingThrow),
        halfDamage: halfMatch,
        pbToAttack: attackMatches ? attackMatches.groups.pb !== undefined : false,
        weaponAttack: attackMatches
          ? (attackMatches.groups.type.toLowerCase() === "weapon" || attackMatches.groups.type === "")
          : false,
        // warning - unclear how to parse these out for 2024 monsters
        // https://comicbook.com/gaming/news/dungeons-dragons-first-look-2025-monster-manual/
        spellAttack: attackMatches ? attackMatches.groups.type.toLowerCase() === "spell" : false,
        meleeAttack: attackMatches ? attackMatches.groups.range.includes("Melee") : false,
        rangedAttack: attackMatches ? attackMatches.groups.range.includes("Ranged") : false,
        healingAction: healingMatch,
        toHit: attackMatches
          ? Number.isInteger(parseInt(attackMatches.groups.bonus))
            ? parseInt(attackMatches.groups.bonus)
            : 0
          : 0,
        yourSpellAttackModToHit: attackMatches ? attackMatches.groups.bonus?.startsWith("your spell") : false,
      },
    };

    return result;
  }

}
