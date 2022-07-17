if (!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

const lastArg = args[args.length - 1];
console.warn(args);

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  const dataTracker = {
    randomId: randomID(),
    targetUuids: lastArg.targetUuids,
    startRound: game.combat.round,
    startTurn: game.combat.turn,
  };

  const item = await fromUuid(lastArg.itemUuid);
  // await item.update(dataTracker);
  await DAE.unsetFlag(item, `${safeName}ItemTracker`);
  await DAE.setFlag(item, `${safeName}ItemTracker`, dataTracker);

  return AAhelpers.applyTemplate(args);
}


async function applySpikeGrowthDamage() {
  const item = await fromUuid(lastArg.efData.origin);
  const target = canvas.tokens.get(lastArg.tokenId);

  const caster = item.parent;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const damageRoll = await new Roll(`2d4[piercing]`).evaluate({ async: true });
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
    "piercing",
    [target],
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes["piercing"]})`,
      itemCardId: "new",
      itemData: workflowItemData,
      isCritical: false,
    }
  );

}

function getPositionData(token) {
  const dataTracker = {
    origin: lastArg.efData.origin,
    position: {
      x: token.data.x,
      y: token.data.y,
      elevation: token.data.elevation,
    }
  };
  return dataTracker;
}

if (args[0] === "on") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const token = await fromUuid(lastArg.tokenUuid);
  const positionDataTracker = getPositionData(token);

  const item = await fromUuid(lastArg.efData.origin);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}ItemTracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(lastArg.tokenUuid);
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target, `${safeName}TurnTracker`);
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
  } else if (targetedThisCombat) {
    await applySpikeGrowthDamage();
  }

  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
  await DAE.setFlag(token, `${safeName}PositionTracker`, positionDataTracker);
}


if (args[0] === "off") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTrackerFlag = DAE.getFlag(target, `${safeName}PositionTracker`);
  const currentTrackerFlag = getPositionData(target);
  const isSame = isObjectEmpty(diffObject(targetTrackerFlag, currentTrackerFlag));

  console.warn("isSame", {
    target,
    targetTrackerFlag,
    currentTrackerFlag,
    isSame,
  });

  await DAE.unsetFlag(token, `${safeName}PositionTracker`);
  await ActiveAuras.MainAura(token, "movement update", token.parent.id);

  if (!isSame) {
    await applySpikeGrowthDamage();
    const token = await fromUuid(lastArg.tokenUuid);
    await ActiveAuras.MainAura(token, "movement update", token.parent.id);
  }

}
