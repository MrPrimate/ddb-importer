if (!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
}

if (!game.combat) {
  ui.notifications.error("No combat, not applying effect");
  return;
}

const lastArg = args[args.length - 1];
console.warn("macro caled", {
  args,
  isOnUse: args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects",
  lastArgs: lastArg.tag === "OnUse" && lastArg.macroPass === "preActiveEffects",
  lastArg,
})

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  return game.modules.get("ActiveAuras").api.AAHelpers.applyTemplate(args);
}


async function applySpikeGrowthDamage() {
  const item = await fromUuid(lastArg.efData.origin);
  const target = canvas.tokens.get(lastArg.tokenId);

  const caster = item.parent;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const damageRoll = await new CONFIG.Dice.DamageRoll(`2d4[piercing]`).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll);
  const workflowItemData = duplicate(item);
  workflowItemData.system.components.concentration = false;
  workflowItemData.system.duration = { value: null, units: "inst" };
  workflowItemData.system.target = { value: null, width: null, units: "", type: "creature" };

  setProperty(workflowItemData, "flags.itemacro", {});
  setProperty(workflowItemData, "flags.midi-qol", {});
  setProperty(workflowItemData, "flags.dae", {});
  setProperty(workflowItemData, "effects", []);
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
      flavor: `(${CONFIG.DND5E.damageTypes["piercing"]})`,
      itemCardId: "new",
      itemData: workflowItemData,
      isCritical: false,
    }
  );

}

function getDamageTestString(token, flags) {
  console.warn("getDamageTestString", token)
  return `${flags.origin}-${flags.round}-${flags.turn}-${flags.randomId}-${token.x}-${token.y}-${token.document?.elevation ?? token.elevation}`;
}

if (args[0] === "on") {
  const safeName = (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
  const item = await fromUuid(lastArg.efData.origin);
  const targetItemTracker = DAE.getFlag(item.parent, `${safeName}ItemTracker`);
  console.warn("token tracker on", targetItemTracker);
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
  const existingTestString = hasProperty(targetTokenTracker, "testString");
  const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;

  if (castTurn && originalTarget && targetTokenTracker.firstRound) {
    console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    targetTokenTracker.firstRound = false;
  } else if (!existingTestString || (existingTestString && targetTokenTracker.testString !== testString)) {
    await applySpikeGrowthDamage();
  }

  targetTokenTracker["testString"] = testString;
  await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
  console.warn("taget", target);
}


if (args[0] === "off") {
  const safeName =  (lastArg.efData.name ?? lastArg.efData.label).replace(/\s|'|\.|’/g, "_");
  const target = canvas.tokens.get(lastArg.tokenId);
  const targetTrackerFlag = DAE.getFlag(target, `${safeName}Tracker`);

  const token = await fromUuid(lastArg.tokenUuid);
  targetTrackerFlag["testString"] = getDamageTestString(token, targetTrackerFlag);

  await DAE.setFlag(token, `${safeName}Tracker`, targetTrackerFlag);
  await game.modules.get("ActiveAuras").api.ActiveAuras.MainAura(token, "movement update", token.parent.id);
}
