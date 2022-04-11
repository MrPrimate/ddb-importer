if (!game.modules.get("advanced-macros")?.active) {
  ui.notifications.error("Advanced Macros is not enabled");
  return;
} else if (!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

const damageType = "piercing";
const lastArg = args[args.length - 1];
console.warn(args);

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  const safeName = lastArg.itemData.name.replace(/\s|'|\.|’/g, "_");
  const dataTracker = {
    randomId: randomID(),
    targetUuids: lastArg.targetUuids,
    startRound: game.combat.round,
    startTurn: game.combat.turn,
  };

  const item = await fromUuid(lastArg.itemUuid);
  // await item.update(dataTracker);
  await DAE.unsetFlag(item, `${safeName}Tracker`);
  await DAE.setFlag(item, `${safeName}Tracker`, dataTracker);

  return AAhelpers.applyTemplate(args);
}
if (args[0] === "on" || args[0] === "each") {
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
      firstRound: true,
    };

  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
  const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;

  if (castTurn && originalTarget && targetTokenTracker.firstRound) {
    console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    targetTokenTracker.firstRound = false;
  } else{
    const caster = item.parent;
    const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
    const damageRoll = await new Roll(`2d4[${damageType}]`).evaluate({ async: true });
    if (game.dice3d) game.dice3d.showForRoll(damageRoll);
    const workflowItemData = duplicate(item.data);
    workflowItemData.data.components.concentration = false;
    workflowItemData.data.duration = { value: null, units: "inst" };
    workflowItemData.data.target = { value: null, width: null, units: "", type: "creature" };

    setProperty(workflowItemData, "flags.itemacro", {});
    setProperty(workflowItemData, "flags.midi-qol", {});
    setProperty(workflowItemData, "flags.dae", {});
    setProperty(workflowItemData, "effects", []);
    delete workflowItemData._id;
    workflowItemData.name = `${workflowItemData.name}: Movement Damage`;
    // console.warn("workflowItemData", workflowItemData);

    await new MidiQOL.DamageOnlyWorkflow(
      caster,
      casterToken.data,
      damageRoll.total,
      damageType,
      [target],
      damageRoll,
      {
        flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`,
        itemCardId: "new",
        itemData: workflowItemData,
        isCritical: false,
      }
    );
    const effect = target.actor.effects.find((i) => i.data.label === "Spike Growth");
    await effect.delete();
  }

  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);

}
