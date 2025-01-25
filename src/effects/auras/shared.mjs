import { logger } from "../../lib/_module.mjs";
import DDBEffectHelper from "../DDBEffectHelper.mjs";


function getSafeName(name) {
  return name.replace(/\s|'|\.|’/g, "_");
}

// flags.ddbimporter.effect used to determine how the aura behaves
// const effectData = {
//   activityIds: [], // activity ids to retain on duplicated item
//   sequencerFile: "fun.webp", // sequencer file to apply for animation
//   sequencerScale: 1, // sequencer scale for animations
//   condition: "prone", // condition to apply
//   everyEntry: false, // apply the save/condition on every entry
//   allowVsRemoveCondition: false, // allow a save vs remove condiiton
//   removeOnOff: true, // remove condition when effect ends
//   applyImmediate: false, // apply effect immediately based on failed saves of rolled item
//   removalCheck: false, // an ability check is used for removal
//   removalSave: false, // an ability save is used for removal
//   isCantrip: false, // will attempt to replace @cantripDice used in any effect change with actors cantrip dice number
//   nameSuffix: ": Damage" // append to rolled save/damage name
// };

// a tracker is created on the origin document/aura document to track the aura
// and a tracker is created on each token to have an aura processed on it to track various states
// const tracker = {
//   targetUuids: [],
//   randomId: "16digits",
//   startRound: 0,
//   startTurn: 0,
//   hasLeft: false,
//   condition: "prone",
//   spellLevel: 1,
// };

function createDataTracker({
  targetUuids,
  spellLevel,
  hasLeft = false,
  randomId = foundry.utils.randomID(),
} = {}, trackerFlags = {}) {
  const dataTracker = foundry.utils.mergeObject({
    randomId,
    targetUuids,
    startRound: game.combat?.round ?? 0,
    startTurn: game.combat?.turn ?? 0,
    spellLevel,
    hasLeft,
  }, trackerFlags);
  return dataTracker;
}

async function generateDataTracker({
  targetUuids,
  spellLevel,
  originDocument,
  wait = false,
  actor,
}) {
  const dataTracker = createDataTracker({ targetUuids, spellLevel });
  if (wait) await DDBEffectHelper.wait(500);

  const safeName = getSafeName(originDocument.name);

  await DAE.unsetFlag(actor, `${safeName}Tracker`);
  await DAE.setFlag(actor, `${safeName}Tracker`, dataTracker);

  return dataTracker;
}

async function rollDocumentActivityMidiQol({
  targetToken,
  originDocument,
  level = 0,
  activityIds = [],
  nameSuffix = "",
} = {}) {

  const workflowItemData = DDBEffectHelper.documentWithFilteredActivities({
    document: originDocument,
    activityIds,
    parent: originDocument.parent,
    clearEffectFlags: true,
    renameDocument: `${originDocument.name}${nameSuffix}`,
  });

  await DDBEffectHelper.rollMidiItemUse(workflowItemData, {
    targets: [targetToken.document.uuid],
    slotLevel: level,
    scaling: (level ?? 0) - originDocument.system.level,
  });
}

async function applyConditionVsSave({
  condition,
  targetToken,
  item,
  itemLevel,
  activityIds,
  nameSuffix = "",
}) {
  logger.debug(`Running ${item.name}, applyConditionVsSave`);
  if (DDBEffectHelper.isConditionEffectAppliedAndActive(condition, targetToken.actor)) return true;

  const resolvedNameSuffix = nameSuffix === `: ${condition} save` ? "" : nameSuffix;
  const workflowItemData = DDBEffectHelper.documentWithFilteredActivities({
    document: item,
    activityIds,
    parent: item.parent,
    clearEffectFlags: true,
    renameDocument: `${item.name}${resolvedNameSuffix}`,
  });

  const saveTargets = [...(game.user?.targets ?? [])].map((t) => t.id);
  game.user.updateTokenTargets([targetToken.id]);
  const [config, options] = DDBEffectHelper.syntheticItemWorkflowOptions({
    slotLevel: itemLevel,
    scaling: (itemLevel ?? 0) - item.system.level,
  });
  const result = await MidiQOL.completeItemUse(workflowItemData, config, options);

  // console.warn("APPLY CONDITION VS SAVE RESULT", {result, workflowItemData});
  game.user.updateTokenTargets(saveTargets);
  const failedSaves = Array.from(result.failedSaves);
  const statusOnWorkflow = workflowItemData.effects.some((e) =>
    e.statuses.some((s) => s.name.toLowerCase() === condition),
  );
  if (failedSaves.length > 0 && !statusOnWorkflow) {
    await DDBEffectHelper.adjustCondition({
      add: true,
      conditionName: condition,
      actor: failedSaves[0].actor,
    });
  }

  return result;
}

export async function checkAuraAndUseActivity({
  originDocument,
  tokenUuid,
  activityIds = [],
  nameSuffix = "",
} = {}) {
  const safeName = getSafeName(originDocument.name);
  const targetItemTracker = DAE.getFlag(originDocument.parent, `${safeName}Tracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(tokenUuid);
  const tokenId = tokenUuid.split(".").pop();
  const target = canvas.tokens.get(tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target.actor, `${safeName}Tracker`);
  const targetedThisCombat = targetTokenTrackerFlag && targetItemTracker.randomId === targetTokenTrackerFlag.randomId;
  const targetTokenTracker = targetedThisCombat
    ? targetTokenTrackerFlag
    : createDataTracker({
      targetUuids: targetItemTracker.targetUuids ?? [tokenUuid],
      randomId: targetItemTracker.randomId,
      hasLeft: false,
      spellLevel: targetItemTracker.spellLevel,
    });

  const castTurn = targetItemTracker.startRound === game.combat.round
    && targetItemTracker.startTurn === game.combat.turn;
  const isLaterTurn = game.combat.round > targetTokenTracker.round
    || game.combat.turn > targetTokenTracker.turn;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn
  if (castTurn && originalTarget) {
    logger.debug(`Token ${target.name} is part of the original target for ${originDocument.name}`);
  } else if (!targetedThisCombat || (targetedThisCombat && targetTokenTracker.hasLeft && isLaterTurn)) {
    logger.debug(`Token ${target.name} is targeted for immediate damage with ${originDocument.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
    targetTokenTracker.hasLeft = false;
    await rollDocumentActivityMidiQol({
      targetToken: target,
      originDocument,
      level: targetTokenTracker.spellLevel,
      activityIds,
      nameSuffix,
    });
  }
  await DAE.setFlag(target.actor, `${safeName}Tracker`, targetTokenTracker);
}

export async function checkAuraAndApplyCondition({
  originDocument,
  wait = false,
  tokenUuid,
  condition = null,
  everyEntry = false,
  allowVsRemoveCondition = false,
  activityIds = [],
  nameSuffix = "",
} = {}) {
  logger.debug(`Running ${originDocument.name}, checkAuraAndApplyCondition`);

  const combatRound = game.combat?.round ?? 0;
  const combatTurn = game.combat?.turn ?? 0;

  const safeName = getSafeName(originDocument.name);
  // sometimes the round info has not updated, so we pause a bit
  if (wait) await DDBEffectHelper.wait(500);
  const targetItemTracker = DAE.getFlag(originDocument.parent, `${safeName}Tracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(tokenUuid);
  // const target = canvas.tokens.get(lastArg.tokenId);
  const tokenId = tokenUuid.split(".").pop();
  const target = canvas.tokens.get(tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target.actor, `${safeName}Tracker`);
  const targetedThisCombat = targetTokenTrackerFlag
    && targetItemTracker.randomId === targetTokenTrackerFlag.randomId;
  const targetTokenTracker = targetedThisCombat
    ? targetTokenTrackerFlag
    : createDataTracker({
      targetUuids: targetItemTracker.targetUuids ?? [tokenUuid],
      randomId: targetItemTracker.randomId,
      hasLeft: false,
      spellLevel: targetItemTracker.spellLevel,
    }, { condition });

  const castTurn = targetItemTracker.startRound === combatRound
    && targetItemTracker.startTurn === combatTurn;
  const isLaterTurn = combatRound > targetTokenTracker.round
    || combatTurn > targetTokenTracker.turn;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn

  if (castTurn && originalTarget) {
    logger.debug(`Token ${target.name} is part of the original target for ${originDocument.name}`);
  } else if (everyEntry || !targetedThisCombat || (targetedThisCombat && isLaterTurn)) {
    logger.debug(`Token ${target.name} is targeted for immediate save vs condition with ${originDocument.name}, using the following factors`, {
      originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn, target,
    });
    targetTokenTracker.hasLeft = false;
    await applyConditionVsSave({
      condition,
      targetToken: target,
      item: originDocument,
      spellLevel: targetItemTracker.spellLevel,
      activityIds,
      nameSuffix,
    });
  }
  await DAE.setFlag(target.actor, `${safeName}Tracker`, targetTokenTracker);
  const effectApplied = DDBEffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, target.actor);
  const currentTokenCombatTurn = game.combat.current.tokenId === tokenId;
  if (currentTokenCombatTurn && allowVsRemoveCondition && effectApplied) {
    logger.log(`Removing ${condition}`);
    await DDBEffectHelper.attemptConditionRemovalDialog(target, condition, {
      document: originDocument,
    });
  }

}


export async function removeAuraFromToken({
  effectOrigin,
  tokenUuid,
  removeOnOff = true,
} = {}) {
  const originDocument = await fromUuid(effectOrigin);
  logger.debug(`Running ${originDocument.name}, removeAuraFromToken`);
  const safeName = getSafeName(originDocument.name);
  const targetToken = await fromUuid(tokenUuid);
  logger.verbose("removeAuraFromToken args", {
    targetToken,
    tokenUuid,
    effectOrigin,
    originDocument,
  });
  const targetTokenTracker = await DAE.getFlag(targetToken.actor, `${safeName}Tracker`);
  logger.debug("targetTokenTracker", { targetTokenTracker });

  if (!targetTokenTracker) {
    logger.error(`No ${safeName}Tracker found for ${targetToken.name}`);
    return;
  }

  if (targetTokenTracker.condition && removeOnOff
    && DDBEffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, targetToken.actor)
  ) {
    logger.debug(`Removing ${targetTokenTracker.condition} from ${targetToken.name}`);
    await DDBEffectHelper.adjustCondition({
      remove: true,
      conditionName: targetTokenTracker.condition,
      actor: targetToken.actor,
    });
  }

  targetTokenTracker.hasLeft = true;
  targetTokenTracker.turn = game.combat?.turn ?? 0;
  targetTokenTracker.round = game.combat?.round ?? 0;
  await DAE.setFlag(targetToken.actor, `${safeName}Tracker`, targetTokenTracker);
}


export async function applyAuraToTemplate(returnArgs, {
  originDocument,
  condition = null,
  sequencerFile = null,
  sequencerScale = 1,
  targetUuids = [],
  applyImmediate = false,
  templateUuid,
  spellLevel,
  failedSaveTokens = [],
  isCantrip = false,
} = {}) {
  logger.debug(`Running ${originDocument.name}, applyAuraToTemplate`);
  await generateDataTracker({
    originDocument,
    targetUuids,
    spellLevel,
    actor: originDocument.actor,
  });

  if (sequencerFile) {
    const scale = sequencerScale ?? 1;
    await DDBEffectHelper.attachSequencerFileToTemplate(templateUuid, sequencerFile, originDocument.uuid, scale);
  }

  if (isCantrip) {
    const cantripDice = DDBEffectHelper.getCantripDice(originDocument.actor);
    returnArgs[0].spellLevel = cantripDice;
    let newEffects = returnArgs[0].item.effects.map((effect) => {
      effect.changes = effect.changes.map((change) => {
        change.value = change.value.replaceAll("@cantripDice", cantripDice);
        return change;
      });
      return effect;
    });
    returnArgs[0].item.effects = foundry.utils.duplicate(newEffects);
    returnArgs[0].itemData.effects = foundry.utils.duplicate(newEffects);
  }

  if (applyImmediate) {
    await DDBEffectHelper.wait(500);
    for (const token of failedSaveTokens) {
      if (!DDBEffectHelper.isConditionEffectAppliedAndActive(condition, token.actor)) {
        logger.debug(`Applying ${condition} to ${token.name}`);
        await DDBEffectHelper.adjustCondition({ add: true, conditionName: condition, actor: token.actor });
      }
    };
  }

  const templateResult = await game.modules.get("ActiveAuras").api.AAHelpers.applyTemplate(returnArgs);
  return templateResult;

}
