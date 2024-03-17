if (!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

if (!game.combat) {
  ui.notifications.error("No combat, not applying effect");
  return;
}

const lastArg = args[args.length - 1];
// console.warn("macro caled", {
//   args,
//   isOnUse: args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects",
//   lastArgs: lastArg.tag === "OnUse" && lastArg.macroPass === "preActiveEffects",
//   lastArg,
//   actor
// })

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  const safeName = lastArg.itemData.name.replace(/\s|'|\.|’/g, "_");
  const dataTracker = {
    origin: lastArg.itemUuid,
    randomId: foundry.utils.randomID(),
    targetUuids: lastArg.targetUuids,
    startRound: game.combat.round,
    startTurn: game.combat.turn,
  };
  await DAE.unsetFlag(lastArg.actor, `${safeName}ItemTracker`);
  await DAE.setFlag(lastArg.actor, `${safeName}ItemTracker`, dataTracker);

  return game.modules.get("ActiveAuras").api.AAHelpers.applyTemplate(args);

}


async function applySpikeGrowthDamage() {
  const item = await fromUuid(lastArg.efData.origin);
  const target = canvas.tokens.get(lastArg.tokenId);

  const caster = item.parent;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const damageRoll = await new CONFIG.Dice.DamageRoll(`2d4[piercing]`).evaluate({ async: true });
  await MidiQOL.displayDSNForRoll(damageRoll, "damageRoll");
  const workflowItemData = foundry.utils.duplicate(item);
  workflowItemData.system.properties = DDBImporter?.EffectHelper.removeFromProperties(workflowItemData.system.properties, "concentration") ?? [];
  workflowItemData.system.duration = { value: null, units: "inst" };
  workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };

  foundry.utils.setProperty(workflowItemData, "flags.itemacro", {});
  foundry.utils.setProperty(workflowItemData, "flags.midi-qol", {});
  foundry.utils.setProperty(workflowItemData, "flags.dae", {});
  foundry.utils.setProperty(workflowItemData, "effects", []);
  delete workflowItemData._id;
  workflowItemData.name = `${workflowItemData.name}: Movement Damage`;

  await new MidiQOL.DamageOnlyWorkflow(
    caster,
    casterToken,
    damageRoll.total,
    "piercing",
    [target],
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes["piercing"].label})`,
      itemCardId: "new",
      itemData: workflowItemData,
      isCritical: false,
    }
  );

}

function getDamageTestString(token, flags) {
  // console.warn("getDamageTestString", token)
  return `${flags.origin}-${flags.round}-${flags.turn}-${flags.randomId}-${token.x}-${token.y}-${token.document?.elevation ?? token.elevation}`;
}

if (args[0] === "on") {
  const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
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
    };

  const testString = getDamageTestString(target, targetTokenTracker);
  const existingTestString = foundry.utils.hasProperty(targetTokenTracker, "testString");
  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;

  if (castTurn && originalTarget && targetTokenTracker.firstRound) {
    console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    targetTokenTracker.firstRound = false;
  } else if (!existingTestString || (existingTestString && targetTokenTracker.testString !== testString)) {
    await applySpikeGrowthDamage();
  }

  targetTokenTracker["testString"] = testString;
  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
}


if (args[0] === "off") {
  const safeName =  (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTrackerFlag = DAE.getFlag(target, `${safeName}Tracker`);

  const tToken = await fromUuid(lastArg.tokenUuid);
  targetTrackerFlag["testString"] = getDamageTestString(tToken, targetTrackerFlag);

  await DAE.setFlag(tToken.actor, `${safeName}Tracker`, targetTrackerFlag);
  await game.modules.get("ActiveAuras").api.ActiveAuras.MainAura(tToken, "movement update", tToken.parent.id);
}
