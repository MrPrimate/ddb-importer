import { baseMonsterFeatureEffect } from "../specialMonsters.js";
import utils from "../../lib/utils.js";
import DICTIONARY from "../../dictionary.js";
import { generateStatusEffectChange } from "../effects.js";
import logger from "../../logger.js";
import DDBMonsterFeature from "../../parser/monster/features/DDBMonsterFeature.js";

const DEFAULT_DURATION = 60;

function overTimeDamage({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc } = {}) {
  return {
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: `turn=${turn},label=${document.name} (${utils.capitalize(turn)} of Turn),damageRoll=${damage},damageType=${damageType},saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},saveDamage=${saveDamage},killAnim=true`,
    priority: "20",
  };
}

function overTimeSave({ document, turn, saveAbility, saveRemove = true, dc } = {}) {
  const turnValue = turn === "action" ? "end" : turn;
  const actionSave = turn === "action" ? ",actionSave=true" : "";
  return {
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: `turn=${turnValue},label=${document.name} (${utils.capitalize(turn)} of Turn),saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},killAnim=true${actionSave}`,
    priority: "20",
  };
}

function startOrEnd(text) {
  const re = /at the (start|end) of each/i;
  const match = text.match(re);
  if (match) {
    return match[1];
  } else {
    return undefined;
  }
}

function getDuration(text) {
  const re = /for (\d+) (minute|hour)/;
  const match = text.match(re);
  if (match) {
    let minutes = parseInt(match[1]) * 60;
    if (match[2] === "hour") {
      minutes *= 60;
    }
    return minutes;
  } else {
    const reRounds = /for (\d+) round/;
    const roundMatch = text.match(reRounds);
    if (roundMatch) {
      return roundMatch[1] * 6;
    }
  }
  return DEFAULT_DURATION;
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

function getSpecialDuration (effect, match) {
  // minutes
  if (match[7]
    && (match[7].includes("until the end of its next turn")
    || match[7].includes("until the end of the target's next turn"))
  ) {
    setProperty(effect, "flags.dae.specialDuration", ["turnEnd"]);
  } else if (match[7] && match[7].includes("until the start of the")) {
    setProperty(effect, "flags.dae.specialDuration", ["turnStartSource"]);
  }
  return effect;
}

function generateConditionEffect(effect, text) {
  let results = {
    success: false,
    effect,
  };
  text = utils.nameString(text);
  const conditionSearch = /DC (\d+) (\w+) saving throw(?:,)? or (be |be cursed|become|die|contract|have|it can't|suffer|gain|lose the)\s?(?:knocked )?(\w+)?\s?(?:for (\d+) (minute))?(.*)?(?:.|$)/;
  const match = text.match(conditionSearch);
  // console.warn("condition status", match);
  if (match) {
    results.success = true;
    results.save = {
      dc: parseInt(match[1]),
      ability: match[2].toLowerCase().substr(0, 3),
      scaling: "flat",
    };
    // group 4 condition - .e.g. "DC 18 Strength saving throw or be knocked prone"
    const group4Condition = match[4]
      ? DICTIONARY.character.damageAdjustments
        .filter((type) => type.type === 4)
        .find((type) => type.name.toLowerCase() === match[4].toLowerCase() || type.foundryValue === match[4].toLowerCase())
      : undefined;
    if (group4Condition) {
      results.condition = group4Condition.value;
      results.effect.changes.push(generateStatusEffectChange(group4Condition.name, 20, true));
      effect = getSpecialDuration(results.effect, match);
    } else if (match[3] && match[3] === "die") {
      results.effect.changes.push(generateStatusEffectChange("Dead"));
    }
  }
  return results;
}

function overTimeSaveEnd(document, effect, save, text) {
  const saveSearch = /repeat the saving throw at the (end|start) of each/;
  const match = text.match(saveSearch);
  if (match) {
    effect.changes.push(overTimeSave({ document, turn: match[1], saveAbility: save.ability, dc: save.dc }));
  } else {
    const actionSaveSearch = /can use its action to repeat the saving throw/;
    const actionSaveMatch = text.match(actionSaveSearch);
    if (actionSaveMatch) {
      effect.changes.push(overTimeSave({ document, turn: "action", saveAbility: save.ability, dc: save.dc }));
    }
  }
}

export function getMonsterFeatureDamage(damageText) {
  const feature = new DDBMonsterFeature("overTimeFeature", { html: damageText });
  feature.prepare();
  feature.generateExtendedDamageInfo();
  return feature.actionInfo.damage;
}

export function getOvertimeDamage(text) {
  if (text.includes("taking") && (text.includes("on a failed save") || text.includes("damage on a failure"))) {
    const damageText = text.split("taking")[1];
    return getMonsterFeatureDamage(damageText);
  }
  return undefined;
}

function effectCleanup(document, actor, effect) {
  if (effect.changes.length > 0) {
    document.effects.push(effect);
    let overTimeFlags = hasProperty(actor, "flags.monsterMunch.overTime") ? getProperty(actor, "flags.monsterMunch.overTime") : [];
    overTimeFlags.push(document.name);
    setProperty(actor, "flags.monsterMunch.overTime", overTimeFlags);
    // console.warn(`ITEM OVER TIME EFFECT: ${actor.name}, ${document.name}`);
    if (getProperty(document, "system.duration.units") === "inst") {
      setProperty(document, "system.duration", {
        units: "round",
        value: effect.duration.rounds,
      });
    }
    logger.debug(`Generating damage over time effect for ${actor.name}, ${actor.name}`);
  }
  return { document, actor };
}

export function generateOverTimeEffect(actor, document) {
  logger.debug("Generating damage over time effect for", document.name);
  if (!document.effects) document.effects = [];
  let effect = baseMonsterFeatureEffect(document, `${document.name}`);
  // add any condition effects
  const conditionResults = generateConditionEffect(effect, document.system.description.value);
  effect = conditionResults.effect;
  if (conditionResults.success) {
    setProperty(document, "flags.midiProperties.fulldam", true);
    overTimeSaveEnd(document, effect, conditionResults.save, document.system.description.value);
  }

  const durationSeconds = hasProperty(document.flags, "monsterMunch.overTime.durationSeconds")
    ? getProperty(document.flags, "monsterMunch.overTime.durationSeconds")
    : getDuration(document.system.description.value);
  setProperty(effect, "duration.seconds", durationSeconds);
  const durationRounds = Number.parseInt(durationSeconds / 6);
  setProperty(effect, "duration.rounds", durationRounds);

  const turn = startOrEnd(document.system.description.value);
  if (!turn) return effectCleanup(document, actor, effect);

  const saveFeature = new DDBMonsterFeature("overTimeSaveFeature", { html: document.system.description.value });
  saveFeature.prepare();
  const save = saveFeature.getFeatSave();
  if (!Number.isInteger(Number.parseInt(save.dc))) return effectCleanup(document, actor, effect);

  const saveAbility = save.ability;
  const dc = save.dc;

  const dmg = getOvertimeDamage(document.system.description.value);

  if (!dmg) return effectCleanup(document, actor, effect);

  // overtime damage, revert any full damage flag, reset to default on save
  setProperty(document, "flags.midiProperties.fulldam", false);

  const damage = hasProperty(document.flags, "monsterMunch.overTime.damage")
    ? getProperty(document.flags, "monsterMunch.overTime.damage")
    : dmg.parts.reduce((total, current) => {
      total = [total, `${current[0]}[${current[1]}]`].join(" + ");
      return total;
    }, "");

  const damageType = hasProperty(document.flags, "monsterMunch.overTime.damageType")
    ? getProperty(document.flags, "monsterMunch.overTime.damageType")
    : dmg.parts.length > 0 ? dmg.parts[0][1] : "";

  const saveRemove = hasProperty(document.flags, "monsterMunch.overTime.saveRemove")
    ? getProperty(document.flags, "monsterMunch.overTime.saveRemove")
    : true;

  const saveDamage = hasProperty(document.flags, "monsterMunch.overTime.saveDamage")
    ? getProperty(document.flags, "monsterMunch.overTime.saveDamage")
    : "nodamage";

  effect.changes.push(overTimeDamage({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }));
  document.effects.push(effect);

  return effectCleanup(document, actor, effect);
}


export function damageOverTimeEffect({ document, startTurn = false, endTurn = false, durationSeconds, damage, damageType, saveAbility, saveRemove = true, saveDamage = "nodamage", dc }) {
  let effect = baseMonsterFeatureEffect(document, `${document.name}`);

  if (!startTurn && !endTurn) return document;

  if (startTurn) {
    effect.changes.push(overTimeDamage({ document, turn: "start", damage, damageType, saveAbility, saveRemove, saveDamage, dc }));
  }
  if (endTurn) {
    effect.changes.push(overTimeDamage({ document, turn: "end", damage, damageType, saveAbility, saveRemove, saveDamage, dc }));
  }

  setProperty(effect, "duration.seconds", durationSeconds);

  document.effects.push(effect);
  return document;
}
