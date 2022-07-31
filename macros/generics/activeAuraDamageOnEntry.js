if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

const lastArg = args[args.length - 1];

function getCantripDice(actor) {
  const level = actor.type === "character" ? actor.data.details.level : actor.data.details.cr;
  return 1 + Math.floor((level + 1) / 6);
}

async function rollItemDamage(targetToken, itemUuid, itemLevel) {
  const item = await fromUuid(itemUuid);
  const caster = item.parent;
  const ddbEffectFlags = item.data.flags.ddbimporter.effect;
  const isCantrip = ddbEffectFlags.isCantrip;
  const damageDice = ddbEffectFlags.dice;
  const damageType = ddbEffectFlags.damageType;
  const saveAbility = ddbEffectFlags.save;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const scalingDiceArray = item.data.data.scaling.formula.split("d");
  const scalingDiceNumber = itemLevel - item.data.data.level;
  const upscaledDamage =  isCantrip
    ? `${getCantripDice(caster.data)}d${scalingDiceArray[1]}[${damageType}]`
    : scalingDiceNumber > 0 ? `${scalingDiceNumber}d${scalingDiceArray[1]}[${damageType}] + ${damageDice}` : damageDice;

  const workflowItemData = duplicate(item.data);
  workflowItemData.data.target = { value: 1, units: "", type: "creature" };
  workflowItemData.data.save.ability = saveAbility;
  workflowItemData.data.components.concentration = false;
  workflowItemData.data.level = itemLevel;
  workflowItemData.data.duration = { value: null, units: "inst" };
  workflowItemData.data.target = { value: null, width: null, units: "", type: "creature" };

  setProperty(workflowItemData, "flags.itemacro", {});
  setProperty(workflowItemData, "flags.midi-qol", {});
  setProperty(workflowItemData, "flags.dae", {});
  setProperty(workflowItemData, "effects", []);
  delete workflowItemData._id;

  const saveOnEntry = ddbEffectFlags.saveOnEntry;
  console.warn("saveOnEntry", {ddbEffectFlags, saveOnEntry});
  if (saveOnEntry) {
    const entryItem = new CONFIG.Item.documentClass(workflowItemData, { parent: caster });
    console.warn("Saving item on entry", {entryItem, targetToken});
    const options = {
      showFullCard: false,
      createWorkflow: true,
      targetUuids: [targetToken.document.uuid],
      configureDialog: false,
      versatile: false,
      consumeResource: false,
      consumeSlot: false,
    };
    await MidiQOL.completeItemRoll(entryItem, options);
  } else {
    const damageRoll = await new Roll(upscaledDamage).evaluate({ async: true });
    if (game.dice3d) game.dice3d.showForRoll(damageRoll);

    workflowItemData.name = `${workflowItemData.name}: Turn Entry Damage`;
    // console.warn("workflowItemData", workflowItemData);

    await new MidiQOL.DamageOnlyWorkflow(
      caster,
      casterToken.data,
      damageRoll.total,
      damageType,
      [targetToken],
      damageRoll,
      {
        flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`,
        itemCardId: "new",
        itemData: workflowItemData,
        isCritical: false,
      }
    );
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

  const ddbEffectFlags = lastArg.item.flags.ddbimporter?.effect;
  const newArgs = duplicate(args);
  if (ddbEffectFlags) {
    const sequencerFile = ddbEffectFlags.sequencerFile;
    if (sequencerFile) {
      attachSequencerFileToTemplate(lastArg.templateUuid, sequencerFile, lastArg.itemUuid)
    }
    if (ddbEffectFlags.isCantrip) {
      const cantripDice = getCantripDice(lastArg.actor);
      newArgs[0].spellLevel = cantripDice;
      ddbEffectFlags.cantripDice = cantripDice;
      let newEffects = newArgs[0].item.effects.map((effect) => {
        effect.changes = effect.changes.map((change) => {
          change.value = change.value.replace("@cantripDice", cantripDice)
          return change;
        });
        return effect;
      });
      newArgs[0].item.effects = duplicate(newEffects);
      newArgs[0].itemData.effects = duplicate(newEffects);
    }
    const template = await fromUuid(lastArg.templateUuid);
    await template.update({"flags.effect": ddbEffectFlags});
  }

  return await AAhelpers.applyTemplate(newArgs);

} else if (args[0] == "on") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
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

  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
  const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;

  // if:
  // not cast turn, and not part of the original target
  // AND one of the following
  // not original template and have not yet had this effect applied this combat OR
  // has been targeted this combat, left and re-entered effect, and is a later turn
  if (castTurn && originalTarget) {
    console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
  } else if (!targetedThisCombat || (targetedThisCombat && targetTokenTracker.hasLeft && isLaterTurn)){
    console.debug(`Token ${target.name} is targeted for immediate damage with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
    targetTokenTracker.hasLeft = false;
    await rollItemDamage(target, lastArg.efData.origin, targetItemTracker.spellLevel);
  }
  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
} else if (args[0] == "off") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTokenTracker = DAE.getFlag(target, `${safeName}Tracker`);

  if (targetTokenTracker) {
    targetTokenTracker.hasLeft = true;
    targetTokenTracker.turn = game.combat.turn;
    targetTokenTracker.round = game.combat.round;
    await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
  }
}
