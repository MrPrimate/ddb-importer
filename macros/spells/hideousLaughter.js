const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const activity = await fromUuid(lastArg.activity);

const DAEItem = lastArg.efData.flags.dae.itemData;
const saveDC = activity.save.dc.value;
const dcString = saveDC && saveDC !== "" ? `DC${saveDC} ` : "";
const flavor = `${CONFIG.DND5E.abilities["wis"].label} ${dcString}${DAEItem?.name ?? ""}`;


async function cleanUp(removeProne = false) {
  // cleanup conditions
  const hasProne = DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Prone", targetActor);
  const hasIncapacitated = DDBImporter.EffectHelper.isConditionEffectAppliedAndActive("Incapacitated", targetActor);
  if (hasIncapacitated) DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Incapacitated", actor: targetActor });
  if ( removeProne && hasProne ) {
    DDBImporter.EffectHelper.adjustCondition({ remove: true, conditionName: "Prone", actor: targetActor });
  }
  // remove hook
  const flag = await DAE.getFlag(targetActor, "hideousLaughterHook");
  if (flag) {
    Hooks.off("preUpdateActor", flag);
    await DAE.unsetFlag(targetActor, "hideousLaughterHook");
  }
  // remove effect
  await targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
  if (!removeProne && hasProne) DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Prone", actor: targetActor });
}

async function onDamageHook(hookActor, update) {
  const flag = await DAE.getFlag(hookActor, "hideousLaughterHook");
  if (!foundry.utils.hasProperty(update, "system.attributes.hp") || !flag) return;
  const oldHP = hookActor.system.attributes.hp.value;
  const newHP = foundry.utils.getProperty(update, "system.attributes.hp.value");
  const hpChange = oldHP - newHP;
  if (hpChange > 0 && typeof hpChange === "number") {
    const saveActor = game.actors.get(hookActor.id);
    const speaker = ChatMessage.getSpeaker({ targetActor: saveActor, scene: canvas.scene, token: token.document });
    const saveRoll = (await targetActor.rollSavingThrow({
      ability: activity.save.ability.first(),
      target: activity.save.dc.value,
      advantage: true,
    }, {}, { data: { speaker, flavor } }))[0];

    if (saveRoll.total >= saveDC) {
      await cleanUp();
    }
  }
}

if (args[0] === "on") {
  if (targetActor.system.abilities.int.value < 4) {
    await cleanUp(true);
  } else {
    const hookId = Hooks.on("preUpdateActor", onDamageHook);
    await DAE.setFlag(targetActor, "hideousLaughterHook", hookId);
  }
}

if (args[0] === "off") {
  await cleanUp();
}
