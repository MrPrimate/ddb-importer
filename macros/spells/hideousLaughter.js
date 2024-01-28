const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.system.save;
const saveDC = (saveData.dc === null || saveData.dc === "") && saveData.scaling === "spell"
  ? (await fromUuid(lastArg.efData.origin)).parent.getRollData().attributes.spelldc
  : saveData.dc;
const dcString = saveDC && saveDC !== "" ? `DC${saveDC} ` : "";
const flavor = `${CONFIG.DND5E.abilities["wis"].label} DC${dcString}${DAEItem?.name || ""}`;


async function cleanUp() {
  // cleanup conditions
  const hasProne = DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Prone", targetActor);
  if (hasProne) await game.dfreds.effectInterface.toggleEffect({ effectName: "Prone", uuid: targetActor.uuid });
  const hasIncapacitated = DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Incapacitated", targetActor);
  if (hasIncapacitated) await game.dfreds.effectInterface.toggleEffect({ effectName: "Incapacitated", uuid: targetActor.uuid });
  // remove hook
  const flag = await DAE.getFlag(targetActor, "hideousLaughterHook");
  if (flag) {
    Hooks.off("preUpdateActor", flag);
    await DAE.unsetFlag(targetActor, "hideousLaughterHook");
  }
  // remove effect
  await targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
}

async function onDamageHook(hookActor, update) {
  const flag = await DAE.getFlag(hookActor, "hideousLaughterHook");
  if (!hasProperty(update, "system.attributes.hp") || !flag) return;
  const oldHP = hookActor.system.attributes.hp.value;
  const newHP = getProperty(update, "system.attributes.hp.value");
  const hpChange = oldHP - newHP;
  if (hpChange > 0 && typeof hpChange === "number") {
    console.warn("hookActor", hookActor);
    const saveActor = game.actors.get(hookActor.id);
    const saveRoll = await saveActor.rollAbilitySave(saveData.ability, {
      flavor,
      fastForward: true,
      advantage: true,
    });
    if (saveRoll.total >= saveData.dc) {
      await cleanUp();
    }
  }
}

if (args[0] === "on") {
  if (targetActor.system.abilities.int.value < 4) {
    await cleanUp();
  } else {
    const hookId = Hooks.on("preUpdateActor", onDamageHook);
    await DAE.setFlag(targetActor, "hideousLaughterHook", hookId);
  }
}

if (args[0] === "off") {
  await cleanUp();
}

if (args[0] === "each") {
  const saveRoll = await targetActor.rollAbilitySave(saveData.ability, { flavor });
  if (saveRoll.total >= saveData.dc) {
    await cleanUp();
  }
}
