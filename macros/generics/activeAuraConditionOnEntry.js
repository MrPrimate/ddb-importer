if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Advanced Macros is not enabled");
  return;
} else if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

const lastArg = args[args.length - 1];

console.warn(args);

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

function effectAppliedAndActive(conditionName, targetActor) {
  return targetActor.data.effects.some(
    (activeEffect) =>
      activeEffect?.data?.flags?.isConvenient &&
      activeEffect?.data?.label == conditionName &&
      !activeEffect?.data?.disabled
  );
}

// async function applyCondition(targetActor, item) {
//   console.warn(item);
//   const condition = item.data.flags.ddbimporter.effect.condition;
//   if (!effectAppliedAndActive(condition, targetActor)) {
//     const saveAbility = item.data.flags.ddbimporter.effect.save;
//     const saveDC = args[2];
//     const flavor = `${CONFIG.DND5E.abilities[saveAbility]} DC${args[2]} ${item?.name || ""}`;
//     const saveRoll = await targetActor.rollAbilitySave(saveAbility, { flavor, fastFoward: true });

//     if (saveRoll.total < saveDC) {
//       ChatMessage.create({ content: `${targetActor.name} failed the ${item.name} save with a ${saveRoll.total}` });
//       game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: targetActor.uuid });
//     } else {
//       ChatMessage.create({ content: `${targetActor.name} passed the ${item.name} save with a ${saveRoll.total}` });
//     }
//   }
// }

async function applyCondition(condition, targetToken, item, itemLevel) {
  if (!effectAppliedAndActive(condition, targetToken.actor)) {
    const caster = item.parent;
    const workflowItemData = duplicate(item.data);
    workflowItemData.data.target = { value: 1, units: "", type: "creature" };
    workflowItemData.data.save.ability = item.data.flags.ddbimporter.effect.save;
    workflowItemData.data.components.concentration = false;
    workflowItemData.data.level = itemLevel;
    workflowItemData.data.duration = { value: null, units: "inst" };
    workflowItemData.data.target = { value: null, width: null, units: "", type: "creature" };
    workflowItemData.data.preparation.mode = "atwill";
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

    [...result.failedSaves].forEach((failed) => {
      game.dfreds.effectInterface.addEffect({ effectName: condition, uuid: failed.document.uuid });
    });
  }
}

async function attachSequencerFileToTemplate(templateUuid, sequencerFile, originUuid) {
  if (game.modules.get("sequencer")?.active) {
    if (Sequencer.Database.entryExists(sequencerFile)) {
      console.debug("Trying to apply sequencer effect", sequencerFile);
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

  return await AAhelpers.applyTemplate(args);

} else if (args[0] == "on" || args[0] == "each") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
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
    };

    console.warn(game.combat.current.round)
    console.warn(game.combat.round)
    console.warn(game.combat.turn)
    console.warn(game.combat.current.turn)

  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
  const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn
  const condition = item.data.flags.ddbimporter.effect.condition;

  if (castTurn && originalTarget) {
    console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
  } else if (!targetedThisCombat || (targetedThisCombat && isLaterTurn)) {
    console.debug(`Token ${target.name} is targeted for immediate save vs condition with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
    targetTokenTracker.hasLeft = false;
    await applyCondition(target, condition, item, targetItemTracker.spellLevel);
  }
  console.warn("setting token data", targetTokenTracker);
  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
  if (!effectAppliedAndActive(condition, target.actor)) {
    await attemptEscape(target, condition, item);
  }
} else if (args[0] == "off") {
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const item = await fromUuid(lastArg.efData.origin);
  const condition = item.data.flags.ddbimporter?.effect?.condition;

  if (condition && effectAppliedAndActive(condition, targetActor)) game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetActor.uuid });
}
