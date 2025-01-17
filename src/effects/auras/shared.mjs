import { logger } from "../../lib/_module.mjs";
import DDBEffectHelper from "../DDBEffectHelper.mjs";

// flags.ddbimporter.effect used
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
// };

// const targetTokenTracker = {
//   targetUuids: [],
//   randomId: "16digits",
//   startRound: 0,
//   startTurn: 0,
//   hasLeft: false,
//   condition: "prone",
//   spellLevel: 1,
// };

function getSafeName(name) {
  return name.replace(/\s|'|\.|’/g, "_");
}

async function applyConditionVsSave({
  condition,
  targetToken,
  item,
  itemLevel,
  activityIds,
}) {
  logger.debug(`Running ${item.name}, applyConditionVsSave`);
  if (DDBEffectHelper.isConditionEffectAppliedAndActive(condition, targetToken.actor)) return true;

  const workflowItemData = DDBEffectHelper.documentWithFilteredActivities({
    document: item,
    activityIds,
    parent: item.parent,
    clearEffectFlags: true,
    level: itemLevel,
    renameDocument: `${item.name}: ${condition} save`,
  });

  const saveTargets = [...(game.user?.targets ?? [])].map((t) => t.id);
  game.user.updateTokenTargets([targetToken.id]);
  const saveItem = new CONFIG.Item.documentClass(workflowItemData, { parent: item.parent });
  const [config, options] = DDBEffectHelper.syntheticItemWorkflowOptions();
  const result = await MidiQOL.completeItemUse(saveItem, config, options);

  game.user.updateTokenTargets(saveTargets);
  const failedSaves = [...result.failedSaves];
  const statusOnWorkflow = workflowItemData.effects.some((e) =>
    e.statuses.some((s) => s.name.toLowerCase() === condition),
  );
  if (failedSaves.length > 0 && !statusOnWorkflow) {
    await DDBEffectHelper.adjustCondition({ add: true, conditionName: condition, actor: failedSaves[0].document });
  }

  return result;
}

export async function checkAuraAndApplyCondition({
  item,
  wait = false,
  tokenUuid,
  condition = null,
  everyEntry = false,
  allowVsRemoveCondition = false,
  spellLevel = null,
  activityIds = [],
} = {}) {
  logger.debug(`Running ${item.name}, checkAuraAndApplyCondition`);

  const combatRound = game.combat?.round ?? 0;
  const combatTurn = game.combat?.turn ?? 0;

  const safeName = getSafeName(item.name);
  // sometimes the round info has not updated, so we pause a bit
  if (wait) await DDBImporter?.EffectHelper.wait(500);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}Tracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(tokenUuid);
  // const target = canvas.tokens.get(lastArg.tokenId);
  const tokenId = tokenUuid.split(".").pop();
  const target = canvas.tokens.get(tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target.actor, `${safeName}Tracker`);
  const targetedThisCombat = targetTokenTrackerFlag
    && targetItemTracker.randomId === targetTokenTrackerFlag.randomId;
  const targetTokenTracker = targetedThisCombat
    ? targetTokenTrackerFlag
    : {
      targetUuids: targetItemTracker.targetUuids ?? [tokenUuid],
      randomId: targetItemTracker.randomId,
      startRound: combatRound,
      startTurn: combatTurn,
      hasLeft: false,
      condition,
      spellLevel,
    };

  const castTurn = targetItemTracker.startRound === combatRound && targetItemTracker.startTurn === combatTurn;
  const isLaterTurn = combatRound > targetTokenTracker.round || combatTurn > targetTokenTracker.turn;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn

  if (castTurn && originalTarget) {
    logger.debug(`Token ${target.name} is part of the original target for ${item.name}`);
  } else if (everyEntry || !targetedThisCombat || (targetedThisCombat && isLaterTurn)) {
    logger.debug(`Token ${target.name} is targeted for immediate save vs condition with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
    targetTokenTracker.hasLeft = false;
    await applyConditionVsSave({
      condition,
      target,
      item,
      spellLevel: targetItemTracker.spellLevel,
      activityIds,
    });
  }
  await DAE.setFlag(target.actor, `${safeName}Tracker`, targetTokenTracker);
  const effectApplied = DDBEffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, target.actor);
  const currentTokenCombatTurn = game.combat.current.tokenId === tokenId;
  if (currentTokenCombatTurn && allowVsRemoveCondition && effectApplied) {
    logger.log(`Removing ${condition}`);
    await DDBEffectHelper.attemptConditionRemovalDialog(target, condition, {
      document: item,
    });
  }

}


export async function removeAuraFromToken({
  itemOrigin,
  tokenUuid,
  removeOnOff = true,
} = {}) {
  const item = await fromUuid(itemOrigin);
  logger.debug(`Running ${item.name}, removeAuraFromToken`);
  const safeName = getSafeName(item.name);
  const targetToken = await fromUuid(tokenUuid);
  logger.verbose("off args", {
    targetToken,
    tokenUuid,
  });
  const targetTokenTracker = await DAE.getFlag(targetToken.actor, `${safeName}Tracker`);
  logger.debug("targetTokenTracker", { targetTokenTracker });

  if (targetTokenTracker?.condition && removeOnOff
    && DDBEffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, targetToken.actor)
  ) {
    logger.debug(`Removing ${targetTokenTracker.condition} from ${targetToken.name}`);
    await DDBEffectHelper.adjustCondition({
      remove: true,
      conditionName: targetTokenTracker.condition,
      actor: targetToken.actor,
    });
  }

  if (targetTokenTracker) {
    targetTokenTracker.hasLeft = true;
    targetTokenTracker.turn = game.combat?.turn ?? 0;
    targetTokenTracker.round = game.combat?.round ?? 0;
    await DAE.setFlag(targetToken.actor, `${safeName}Tracker`, targetTokenTracker);
  }
}


export async function applyAuraToTemplate(returnArgs, {
  item,
  condition = null,
  sequencerFile = null,
  sequencerScale = 1,
  targetUuids = [],
  applyImmediate = false,
  templateUuid,
  spellLevel,
  failedSaveTokens = [],
} = {}) {
  logger.debug(`Running ${item.name}, applyAuraToTemplate`);
  const safeName = getSafeName(item.name);
  const dataTracker = {
    randomId: foundry.utils.randomID(),
    targetUuids,
    startRound: game.combat?.round ?? 0,
    startTurn: game.combat?.turn ?? 0,
    spellLevel,
  };

  // await item.update(dataTracker);
  await DAE.unsetFlag(item.actor, `${safeName}Tracker`);
  await DAE.setFlag(item.actor, `${safeName}Tracker`, dataTracker);

  // console.warn({
  //   workflow,
  //   dataTracker,
  //   actor: item.actor,
  //   item,
  // });

  if (sequencerFile) {
    const scale = sequencerScale ?? 1;
    await DDBImporter?.EffectHelper.attachSequencerFileToTemplate(templateUuid, sequencerFile, item.uuid, scale);
  }

  if (applyImmediate) {
    await DDBImporter?.EffectHelper.wait(500);
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
