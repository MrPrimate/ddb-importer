import { baseMonsterFeatureEffect } from "../specialMonsters.js";
import utils from "../../utils.js";
import { getFeatSave } from "../../muncher/monster/utils.js";

const DEFAULT_DURATION = 60;

function overTime({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }) {
  return {
    key: "flags.midi-qol.OverTime",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: `turn=end,label=${document.name} (${utils.capitalize(turn)} of Turn),damageRoll=${damage},damageType=${damageType},saveRemove=${saveRemove},saveDC=${dc},saveAbility=${saveAbility},saveDamage=${saveDamage}`,
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
  const re = /for (\d+) minute/;
  const match = text.match(re);
  if (match) {
    return match[1] * 60;
  } else {
    const reRounds = /for (\d+) round/;
    const roundMatch = text.match(reRounds);
    if (roundMatch) {
      return roundMatch[1] * 6;
    }
  }
  return DEFAULT_DURATION;
}

export function generateDamageOverTimeEffect(document, actor, monster) {
  console.warn("Generating damage over time effect for", document.name);
  if (!document.effects) document.effects = [];
  let effect = baseMonsterFeatureEffect(document, `${document.name}`);

  const turn = startOrEnd(document.data.description.value);
  console.warn("turn", turn);

  if (!turn) return document;

  const save = getFeatSave(document.data.description.value, {});

  if (!save.dc) return document;
  console.warn("save", save);

  const saveAbility = save.ability;
  const dc = save.dc;

  const damage = hasProperty(document.flags, "monsterMunch.overTime.damage")
    ? getProperty(document.flags, "monsterMunch.overTime.damage")
    : document.data.damage.versatile.split("[")[0];

  const damageType = hasProperty(document.flags, "monsterMunch.overTime.damageType")
    ? getProperty(document.flags, "monsterMunch.overTime.damageType")
    : document.data.damage.versatile.split("[")[1].split("]")[0];

  const saveRemove = hasProperty(document.flags, "monsterMunch.overTime.saveRemove")
    ? getProperty(document.flags, "monsterMunch.overTime.saveRemove")
    : true;

  const durationSeconds = hasProperty(document.flags, "monsterMunch.overTime.durationSeconds")
    ? getProperty(document.flags, "monsterMunch.overTime.durationSeconds")
    : getDuration(document.data.description.value);

  const saveDamage = hasProperty(document.flags, "monsterMunch.overTime.saveDamage")
    ? getProperty(document.flags, "monsterMunch.overTime.saveDamage")
    : "nodamage";

  effect.changes.push(overTime({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }));
  setProperty(effect, "duration.seconds", durationSeconds);

  setProperty(actor.flags, "monsterMunch.overTimeEffect", true);

  document.effects.push(effect);
  console.warn("ITEM DAMAGE OVER TIME", document);
  return document;
}


export function damageOverTimeEffect({ document, startTurn = false, endTurn = false, durationSeconds, damage, damageType, saveAbility, saveRemove = true, saveDamage = "nodamage", dc }) {
  let effect = baseMonsterFeatureEffect(document, `${document.name}`);

  if (!startTurn && !endTurn) return document;

  if (startTurn) {
    effect.changes.push(overTime({ document, turn: "start", damage, damageType, saveAbility, saveRemove, saveDamage, dc }));
  }
  if (endTurn) {
    effect.changes.push(overTime({ document, turn: "end", damage, damageType, saveAbility, saveRemove, saveDamage, dc }));
  }

  setProperty(effect, "duration.seconds", durationSeconds);

  document.effects.push(effect);
  return document;
}
