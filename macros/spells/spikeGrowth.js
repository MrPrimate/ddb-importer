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

// function getPositionData(token) {
//   const position = {
//     x: token.data.x,
//     y: token.data.y,
//     elevation: token.data.elevation,
//   };
//   return position;
// }

function getDamageTestString(token, flags) {
  return `${flags.origin}-${flags.round}-${flags.turn}-${flags.randomId}-${token.data.x}-${token.data.y}-${token.data.elevation}`;
}

if (args[0] === "on") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}ItemTracker`);
  const originalTarget = targetItemTracker.targetUuids.includes(lastArg.tokenUuid);
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTokenTrackerFlag = DAE.getFlag(target, `${safeName}Tracker`);
  const targetedThisCombat = targetTokenTrackerFlag && targetItemTracker.randomId === targetTokenTrackerFlag.randomId;
  const targetTokenTracker = targetedThisCombat
    ? targetTokenTrackerFlag
    : {
      origin: lastArg.efData.origin,
      randomId: targetItemTracker.randomId,
      round: game.combat.round,
      turn: game.combat.turn,
      firstRound: true,
      position: getPositionData(target),
    };

  const testString = getDamageTestString(target, targetTokenTracker);
  const existingTestString = hasProperty(targetTokenTracker, "testString");

  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
  const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;

  if (castTurn && originalTarget && targetTokenTracker.firstRound) {
    console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    targetTokenTracker.firstRound = false;
  } else if (!existingTestString || (existingTestString && targetTokenTracker.testString !== testString)) {
    await applySpikeGrowthDamage();
  }

  // targetTokenTracker["position"] = getPositionData(target);
  targetTokenTracker["testString"] = testString;
  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
}


if (args[0] === "off") {
  const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTrackerFlag = DAE.getFlag(target, `${safeName}Tracker`);
  const currentTrackerFlag = getPositionData(target);
  const isSame = isObjectEmpty(diffObject(targetTrackerFlag.positionData, currentTrackerFlag));

  console.warn("isSame", {
    target,
    targetTrackerFlag,
    currentTrackerFlag,
    isSame,
  });

  if (!isSame) {
    await applySpikeGrowthDamage();
    const token = await fromUuid(lastArg.tokenUuid);
    targetTrackerFlag["testString"] = getDamageTestString(token, targetTrackerFlag);
    await DAE.setFlag(token, `${safeName}PositionTracker`, targetTrackerFlag);
    await ActiveAuras.MainAura(token, "movement update", token.parent.id);
  }

}
