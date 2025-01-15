if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
} else if (!game.modules.get("ddb-importer")?.active) {
  ui.notifications.error("ddb-importer is not enabled");
  return;
}

const lastArg = args[args.length - 1];

console.warn("ARGS", {
  args,
  lastArg,
})

async function applyCondition(condition, targetToken, item, itemLevel) {
  //
  if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, targetToken.actor)) {

    const activityIds = foundry.utils.getProperty(item, "flags.ddbimporter.effect.activityIds");
    const workflowItemData = DDBImporter.EffectHelper.documentWithFilteredActivities({
      document: item,
      activityIds,
      parent: item.parent,
      clearEffectFlags: true,
      level: itemLevel,
      renameDocument: `${item.name}: ${condition} save`,
    });

    const saveTargets = [...game.user?.targets].map((t )=> t.id);
    game.user.updateTokenTargets([targetToken.id]);
    const saveItem = new CONFIG.Item.documentClass(workflowItemData, { parent: caster });
    const [config, options] = DDBImporter.EffectHelper.syntheticItemWorkflowOptions();
    const result = await MidiQOL.completeItemUse(saveItem, config, options);

    game.user.updateTokenTargets(saveTargets);
    const failedSaves = [...result.failedSaves];
    const statusOnWorkflow = workflowItemData.effects.some((e) => e.statuses.some((s) => s.name.toLowerCase() === condition));
    if (failedSaves.length > 0 && !statusOnWorkflow) {
      await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: condition, actor: failedSaves[0].document });
    }

    return result;
  }
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  const safeName = lastArg.itemData.name.replace(/\s|'|\.|’/g, "_");
  const dataTracker = {
    randomId: foundry.utils.randomID(),
    targetUuids: lastArg.targetUuids,
    startRound: game.combat.round,
    startTurn: game.combat.turn,
    spellLevel: lastArg.spellLevel,
  };

  const item = await fromUuid(lastArg.itemUuid);
  // await item.update(dataTracker);
  await DAE.unsetFlag(item.actor, `${safeName}Tracker`);
  await DAE.setFlag(item.actor, `${safeName}Tracker`, dataTracker);

  const sequencerFile = lastArg.item.flags.ddbimporter?.effect?.sequencerFile;
  if (sequencerFile) {
    const scale = lastArg.item.flags.ddbimporter.effect.sequencerScale ?? 1;
    await DDBImporter?.EffectHelper.attachSequencerFileToTemplate(lastArg.templateUuid, sequencerFile, lastArg.itemUuid, scale);
  }

  if (lastArg.item.flags.ddbimporter?.effect?.applyImmediate) {
    await DDBImporter?.EffectHelper.wait(500);
    const condition = lastArg.item.flags.ddbimporter.effect.condition;
    for (const token of lastArg.failedSaves) {
      if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, token.actor)) {
        console.debug(`Applying ${condition} to ${token.name}`);
        await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: condition, actor: token.actor });
      }
    };
  }

  return await game.modules.get("ActiveAuras").api.AAHelpers.applyTemplate(args);

} else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  if (lastArg.item.flags.ddbimporter?.effect?.applyImmediate) {
    const condition = lastArg.item.flags.ddbimporter.effect.condition;
    for (const token of lastArg.failedSaves) {
      if (!DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(condition, token.actor)) {
        console.debug(`Applying ${condition} to ${token.name}`);
        await DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: condition, actor: token.actor });
      }
    };
  }
} else if (args[0] == "on" || args[0] == "each") {
  const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
  // sometimes the round info has not updated, so we pause a bit
  if (args[0] == "each") await DDBImporter?.EffectHelper.wait(500);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}Tracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(lastArg.tokenUuid);
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target.actor, `${safeName}Tracker`);
  const targetedThisCombat = targetTokenTrackerFlag && targetItemTracker.randomId === targetTokenTrackerFlag.randomId;
  const targetTokenTracker = targetedThisCombat
    ? targetTokenTrackerFlag
    : {
      randomId: targetItemTracker.randomId,
      round: game.combat.round,
      turn: game.combat.turn,
      hasLeft: false,
      condition: item.flags.ddbimporter.effect.condition,
    };

  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
  const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;
  const everyEntry = foundry.utils.hasProperty(item, "flags.ddbimporter.effect.everyEntry")
    ? item.flags.ddbimporter.effect.everyEntry
    : false;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn

  if (castTurn && originalTarget) {
    console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
  } else if (everyEntry || !targetedThisCombat || (targetedThisCombat && isLaterTurn)) {
    console.debug(`Token ${target.name} is targeted for immediate save vs condition with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
    targetTokenTracker.hasLeft = false;
    await applyCondition(targetTokenTracker.condition, target, item, targetItemTracker.spellLevel);
  }
  await DAE.setFlag(target.actor, `${safeName}Tracker`, targetTokenTracker);
  const allowVsRemoveCondition = item.flags.ddbimporter.effect.allowVsRemoveCondition;
  const effectApplied = DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, target.actor);
  const currentTokenCombatTurn = game.combat.current.tokenId === lastArg.tokenId;
  if (currentTokenCombatTurn && allowVsRemoveCondition && effectApplied) {
    console.log(`Removing ${targetTokenTracker.condition}`);
    await DDBImporter.EffectHelper.attemptConditionRemovalDialog(target, targetTokenTracker.condition, {
      document: item
    });
  }
} else if (args[0] == "off") {
  const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
  const targetToken = await fromUuid(lastArg.tokenUuid);
  console.warn("off args", {
    targetToken,
    tokenUuid: lastArg.tokenUuid,
  })
  const targetTokenTracker = await DAE.getFlag(targetToken.actor, `${safeName}Tracker`);
  console.warn("targetTokenTracker", targetTokenTracker);
  const removeOnOff = foundry.utils.hasProperty(lastArg, "efData.flags.ddbimporter.effect.removeOnOff")
    ? lastArg.efData.flags.ddbimporter.effect.removeOnOff
    : true;

  if (targetTokenTracker?.condition && removeOnOff
    && DDBImporter.EffectHelper.isConditionEffectAppliedAndActive(targetTokenTracker.condition, targetToken.actor)
  ) {
    console.debug(`Removing ${targetTokenTracker.condition} from ${targetToken.name}`);
    await DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: targetTokenTracker.condition, actor: targetToken.actor });
  }

  if (targetTokenTracker) {
    targetTokenTracker.hasLeft = true;
    targetTokenTracker.turn = game.combat.turn;
    targetTokenTracker.round = game.combat.round;
    await DAE.setFlag(targetToken.actor, `${safeName}Tracker`, targetTokenTracker);
  }
}
