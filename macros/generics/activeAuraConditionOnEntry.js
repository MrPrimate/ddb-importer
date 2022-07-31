if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

const lastArg = args[args.length - 1];

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function attemptRemoval(targetToken, condition, item) {
  if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.document.uuid)) {
    new Dialog({
      title: `Use action to attempt to remove ${condition}?`,
      buttons: {
        one: {
          label: "Yes",
          callback: async () => {
            const caster = item.parent;
            const saveDc = caster.system.attributes.spelldc;
            const removalCheck = item.flags.ddbimporter.effect.removalCheck;
            const removalSave = item.flags.ddbimporter.effect.removalSave;
            const ability = removalCheck ? removalCheck : removalSave;
            const type = removalCheck ? "check" : "save";
            const flavor = `${condition} (via ${item.name}) : ${CONFIG.DND5E.abilities[ability]} ${type} vs DC${saveDc}`;
            const rollResult = removalCheck
              ? (await targetToken.actor.rollAbilityTest(ability, { flavor })).total
              : (await targetToken.actor.rollAbilitySave(ability, { flavor })).total;

            if (rollResult >= saveDc) {
              game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetToken.document.uuid });
            } else {
              if (rollResult < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the ${type} for ${item.name}, still has the ${condition} condition.` });
            }
          },
        },
        two: {
          label: "No",
          callback: () => {},
        },
      },
    }).render(true);
  }
}

async function applyCondition(condition, targetToken, item, itemLevel) {
  if (!game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.document.uuid)) {
    const caster = item.parent;
    const workflowItemData = duplicate(item.data);
    workflowItemData.system.target = { value: 1, units: "", type: "creature" };
    workflowItemData.system.save.ability = item.flags.ddbimporter.effect.save;
    workflowItemData.system.components.concentration = false;
    workflowItemData.system.level = itemLevel;
    workflowItemData.system.duration = { value: null, units: "inst" };
    workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };
    workflowItemData.system.preparation.mode = "atwill";
    setProperty(workflowItemData, "flags.itemacro", {});
    setProperty(workflowItemData, "flags.midi-qol", {});
    setProperty(workflowItemData, "flags.dae", {});
    setProperty(workflowItemData, "effects", []);
    delete workflowItemData._id;
    workflowItemData.name = `${workflowItemData.name}: ${item.name} Condition save`;
    // console.warn("workflowItemData", workflowItemData);

    const saveTargets = [...game.user?.targets].map((t )=> t.id);
    game.user.updateTokenTargets([targetToken.id]);
    const saveItem = new CONFIG.Item.documentClass(workflowItemData, { parent: caster });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
    const result = await MidiQOL.completeItemRoll(saveItem, options);

    game.user.updateTokenTargets(saveTargets);
    const failedSaves = [...result.failedSaves];
    if (failedSaves.length > 0) {
      await game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: failedSaves[0].document.uuid });
    }

    return result;
  }
}

async function attachSequencerFileToTemplate(templateUuid, sequencerFile, originUuid) {
  if (game.modules.get("sequencer")?.active) {
    if (Sequencer.Database.entryExists(sequencerFile)) {
      console.debug(`Trying to apply sequencer effect (${sequencerFile}) to ${templateUuid} from ${originUuid}`, sequencerFile);
      const template = await fromUuid(templateUuid);
      new Sequence()
      .effect()
        .file(Sequencer.Database.entryExists(sequencerFile))
        .size({
          width: canvas.grid.size * (template.data.width / canvas.dimensions.distance),
          height: canvas.grid.size * (template.data.width / canvas.dimensions.distance),
        })
        .persist(true)
        .origin(originUuid)
        .belowTokens()
        .opacity(0.5)
        .attachTo(template, { followRotation: true })
        .stretchTo(template, { attachTo: true})
      .play();
    }
  }
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  const safeName = lastArg.itemData.name.replace(/\s|'|\.|’/g, "_");
  const dataTracker = {
    randomId: randomID(),
    targetUuids: lastArg.targetUuids,
    startRound: game.combat.round,
    startTurn: game.combat.turn,
    spellLevel: lastArg.spellLevel,
  };

  const item = await fromUuid(lastArg.itemUuid);
  // await item.update(dataTracker);
  await DAE.unsetFlag(item, `${safeName}Tracker`);
  await DAE.setFlag(item, `${safeName}Tracker`, dataTracker);

  const sequencerFile = lastArg.item.flags.ddbimporter?.effect?.sequencerFile;
  if (sequencerFile) {
    attachSequencerFileToTemplate(lastArg.templateUuid, sequencerFile, lastArg.itemUuid)
  }

  if (lastArg.item.flags.ddbimporter?.effect?.applyImmediate) {
    await wait(500);
    const condition = lastArg.item.flags.ddbimporter.effect.condition;
    for (const token of lastArg.failedSaves) {
      if (!game.dfreds.effectInterface.hasEffectApplied(condition, token.actor.uuid)) {
        console.debug(`Applying ${condition} to ${token.name}`);
        await game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: token.actor.uuid });
      }
    };
  }

  return await AAhelpers.applyTemplate(args);

} else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  if (lastArg.item.flags.ddbimporter?.effect?.applyImmediate) {
    const condition = lastArg.item.flags.ddbimporter.effect.condition;
    for (const token of lastArg.failedSaves) {
      if (!game.dfreds.effectInterface.hasEffectApplied(condition, token.actor.uuid)) {
        console.debug(`Applying ${condition} to ${token.name}`);
        await game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: token.actor.uuid });
      }
    };
  }
} else if (args[0] == "on" || args[0] == "each") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
  // sometimes the round info has not updated, so we pause a bit
  if (args[0] == "each") await wait(500);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}Tracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(lastArg.tokenUuid);
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target, `${safeName}Tracker`);
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
  const everyEntry = hasProperty(item.data, "flags.ddbimporter.effect.everyEntry")
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
  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
  const allowVsRemoveCondition = item.flags.ddbimporter.effect.allowVsRemoveCondition;
  const effectApplied = game.dfreds.effectInterface.hasEffectApplied(targetTokenTracker.condition, target.document.uuid);
  const currentTokenCombatTurn = game.combat.current.tokenId === lastArg.tokenId;
  if (currentTokenCombatTurn && allowVsRemoveCondition && effectApplied) {
    console.warn(`Removing ${targetTokenTracker.condition}`);
    await attemptRemoval(target, targetTokenTracker.condition, item);
  }
} else if (args[0] == "off") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const targetToken = await fromUuid(lastArg.tokenUuid);
  const targetTokenTracker = await DAE.getFlag(targetToken, `${safeName}Tracker`);
  const removeOnOff = hasProperty(lastArg, "efData.flags.ddbimporter.effect.removeOnOff")
    ? lastArg.efData.flags.ddbimporter.effect.removeOnOff
    : true;

  if (targetTokenTracker?.condition && removeOnOff && game.dfreds.effectInterface.hasEffectApplied(targetTokenTracker.condition, lastArg.tokenUuid)) {
    console.debug(`Removing ${targetTokenTracker.condition} from ${targetToken.name}`);
    game.dfreds.effectInterface.removeEffect({ effectName: targetTokenTracker.condition, uuid: lastArg.tokenUuid });
  }

  if (targetTokenTracker) {
    targetTokenTracker.hasLeft = true;
    targetTokenTracker.turn = game.combat.turn;
    targetTokenTracker.round = game.combat.round;
    await DAE.setFlag(targetToken, `${safeName}Tracker`, targetTokenTracker);
  }
}
