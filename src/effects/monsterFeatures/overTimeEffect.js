import { baseMonsterFeatureEffect } from "../specialMonsters.js";
import { logger } from "../../lib/_module.mjs";
import DDBMonsterFeature from "../../parser/monster/features/DDBMonsterFeature.js";
import DDBEffectHelper from "../DDBEffectHelper.mjs";

export function getMonsterFeatureDamage(damageText, featureDoc = null) {
  const preParsed = foundry.utils.getProperty(featureDoc, "flags.monsterMunch.actionInfo.damage");
  if (preParsed) return preParsed;
  logger.debug("Monster feature damage miss", { damageText, featureDoc });
  const feature = new DDBMonsterFeature("overTimeFeature", { html: damageText });
  feature.prepare();
  feature.generateDamageInfo();
  return feature.actionInfo.damage;
}

export function getOvertimeDamage(text, featureDoc = null) {
  if (text.includes("taking") && (text.includes("on a failed save") || text.includes("damage on a failure"))) {
    const damageText = text.split("taking")[1];
    return getMonsterFeatureDamage(damageText, featureDoc);
  }
  return undefined;
}

function effectCleanup(document, actor, effect) {
  if (effect.changes.length > 0 || effect.statuses.length > 0) {
    document.effects.push(effect);
    let overTimeFlags = foundry.utils.hasProperty(actor, "flags.monsterMunch.overTime")
      ? foundry.utils.getProperty(actor, "flags.monsterMunch.overTime")
      : [];
    overTimeFlags.push(document.name);
    foundry.utils.setProperty(actor, "flags.monsterMunch.overTime", overTimeFlags);
    // console.warn(`ITEM OVER TIME EFFECT: ${actor.name}, ${document.name}`);
    if (foundry.utils.getProperty(document, "system.duration.units") === "inst") {
      foundry.utils.setProperty(document, "system.duration", {
        units: "round",
        value: effect.duration.rounds,
      });
    }
    logger.debug(`Cleanup of over time effect for ${actor.name}, ${actor.name} for ${document.name}`, effect);
  }
  return { document, actor };
}

export function generateConditionOnlyEffect(actor, document, otherDescription = null) {
  logger.debug(`Checking for condition effects for ${document.name} on ${actor.name}`);
  const text = otherDescription ?? document.system.description.value;
  if (!document.effects) document.effects = [];
  let effect = baseMonsterFeatureEffect(document, `${document.name}`);
  effect._id = foundry.utils.randomID();
  // add any condition effects
  const conditionResults = DDBEffectHelper.parseStatusCondition({ text, nameHint: document.name });
  effect.changes.push(...conditionResults.effect.changes);
  effect.statuses.push(...conditionResults.effect.statuses);
  if (conditionResults.effect.name) effect.name = conditionResults.effect.name;
  effect.flags = foundry.utils.mergeObject(effect.flags, conditionResults.effect.flags);

  const duration = foundry.utils.hasProperty(document.flags, "monsterMunch.overTime.durationSeconds")
    ? foundry.utils.getProperty(document.flags, "monsterMunch.overTime.durationSeconds")
    : DDBEffectHelper.getDuration(text);
  foundry.utils.setProperty(effect, "duration.seconds", duration.second);
  foundry.utils.setProperty(effect, "duration.rounds", duration.round);

  Object.keys(document.system.activities).forEach((id) => {
    document.system.activities[id].effects.push(
      {
        "_id": effect._id,
        "onSave": false,
      },
    );
  });

  const result = effectCleanup(document, actor, effect);
  return result;
}

// eslint-disable-next-line complexity
export function generateOverTimeEffect(actor, document, otherDescription = null) {
  logger.debug(`Checking for over time effects for ${document.name} on ${actor.name}`);
  const text = otherDescription ?? document.system.description.value;
  if (!document.effects) document.effects = [];
  let effect = baseMonsterFeatureEffect(document, `${document.name}`);
  // add any condition effects
  const conditionResults = DDBEffectHelper.parseStatusCondition({ text });
  effect.changes.push(...conditionResults.effect.changes);
  effect.statuses.push(...conditionResults.effect.statuses);
  if (conditionResults.effect.name) effect.name = conditionResults.effect.name;
  effect.flags = foundry.utils.mergeObject(effect.flags, conditionResults.effect.flags);
  if (conditionResults.success) {
    foundry.utils.setProperty(document, "flags.midiProperties.fulldam", true);
    DDBEffectHelper.overTimeSaveEnd({ document, effect, save: conditionResults.save, text });
  }

  const durationSeconds = foundry.utils.getProperty(document.flags, "monsterMunch.overTime.durationSeconds")
    ?? foundry.utils.getProperty(document.flags, "ddbimporter.overTime.durationSeconds")
    ?? DDBEffectHelper.getDuration(text);
  foundry.utils.setProperty(effect, "duration.seconds", durationSeconds);
  const durationRounds = Number.parseInt(durationSeconds / 6);
  foundry.utils.setProperty(effect, "duration.rounds", durationRounds);

  const turn = DDBEffectHelper.startOrEnd(text);
  if (!turn) {
    logger.debug(`No turn over time effect for ${document.name} on ${actor.name}`);
    return effectCleanup(document, actor, effect);
  }

  const saveFeature = new DDBMonsterFeature("overTimeSaveFeature", { html: text });
  saveFeature.prepare();
  const save = saveFeature.getFeatSave();
  if (!Number.isInteger(Number.parseInt(save.dc))) return effectCleanup(document, actor, effect);

  const saveAbility = save.ability;
  const dc = save.dc;

  const dmg = getOvertimeDamage(text, document);
  if (!dmg) {
    logger.debug(`Adding non damage Overtime effect for ${document.name} on ${actor.name}`);
    return effectCleanup(document, actor, effect);
  }

  // overtime damage, revert any full damage flag, reset to default on save
  foundry.utils.setProperty(document, "flags.midiProperties.fulldam", false);

  const damage = foundry.utils.getProperty(document.flags, "monsterMunch.overTime.damage")
    ?? foundry.utils.getProperty(document.flags, "ddbimporter.overTime.damage")
    ?? dmg.parts.reduce((total, current) => {
      total = [total, `${current[0]}[${current[1]}]`].join(" + ");
      return total;
    }, "");

  const damageType = foundry.utils.getProperty(document.flags, "monsterMunch.overTime.damageType")
    ?? foundry.utils.getProperty(document.flags, "ddbimporter.overTime.damageType")
    ?? (dmg.parts.length > 0
      ? dmg.parts[0][1]
      : "");

  const saveRemove = foundry.utils.getProperty(document.flags, "monsterMunch.overTime.saveRemove")
    ?? foundry.utils.getProperty(document.flags, "ddbimporter.overTime.saveRemove")
    ?? true;

  const saveDamage = foundry.utils.getProperty(document.flags, "monsterMunch.overTime.saveDamage")
    ?? foundry.utils.getProperty(document.flags, "ddbimporter.overTime.saveDamage")
    ?? "nodamage";

  logger.debug(`generateOverTimeEffect: Generated over time effect for ${actor.name}, ${document.name}`);
  effect.changes.push(DDBEffectHelper.overTimeDamage({ document, turn, damage, damageType, saveAbility, saveRemove, saveDamage, dc }));

  const result = effectCleanup(document, actor, effect);
  return result;
}


export function damageOverTimeEffect({ document, startTurn = false, endTurn = false, durationSeconds, damage,
  damageType, saveAbility, saveRemove = true, saveDamage = "nodamage", dc } = {},
) {
  let effect = baseMonsterFeatureEffect(document, `${document.name}`);

  if (!startTurn && !endTurn) return document;

  if (startTurn) {
    logger.debug(`damageOverTimeEffect: Generating damage over time effect START for ${document.name}`);
    effect.changes.push(
      DDBEffectHelper.overTimeDamage({ document, turn: "start", damage, damageType, saveAbility, saveRemove, saveDamage, dc }),
    );
  }
  if (endTurn) {
    logger.debug(`damageOverTimeEffect: Generating damage over time effect END for ${document.name}`);
    effect.changes.push(
      DDBEffectHelper.overTimeDamage({ document, turn: "end", damage, damageType, saveAbility, saveRemove, saveDamage, dc }),
    );
  }

  foundry.utils.setProperty(effect, "duration.seconds", durationSeconds);

  document.effects.push(effect);
  return document;
}
